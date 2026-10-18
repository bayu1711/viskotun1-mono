import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../guardrailLedger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../guardrailLedger')>();
  return { ...actual, getEffectiveGuardrails: async () => actual.BASELINE_GUARDRAIL_POLICY };
});

const generateContent = vi.fn();
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent };
    }
  }
}));

import { COPY } from '../../data/copy';
import { extractPaperProtocol } from '../geminiExtraction';
import { jatsToText, parsePaperIdentifier, resolvePaperSource } from '../paperSource';

const ASTYM_RECORD = {
  title: 'Eccentric Exercise Versus Eccentric Exercise and Soft Tissue Treatment (Astym) in the Management of Insertional Achilles Tendinopathy.',
  authorString: 'McCormack JR, Underwood FB, Slaven EJ, Cappaert TA.',
  journalTitle: 'Sports Health',
  pubYear: '2016',
  doi: '10.1177/1941738116631498',
  pmid: '26893309',
  pmcid: 'PMC4981065'
};

const ASTYM_XML =
  '<article><front><article-title>Eccentric Exercise Versus Astym</article-title></front><body>' +
  '<sec><title>Methods</title><p>Participants performed 3 sets of 15 heel drops &amp; stretches twice daily.</p></sec>' +
  '<table-wrap><table><tr><td>Week</td><td>1&#x2013;12</td></tr></table></table-wrap></body>' +
  '<back><ref-list><ref>Alfredson H. 1998.</ref></ref-list></back></article>';

function mockEuropePmc(record: object | null, xml: string | null) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes('/search?')) {
      return new Response(JSON.stringify({ resultList: { result: record ? [record] : [] } }), { status: 200 });
    }
    return xml ? new Response(xml, { status: 200 }) : new Response('', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  generateContent.mockReset();
});

describe('parsePaperIdentifier', () => {
  it.each([
    ['https://doi.org/10.1177/1941738116631498', { kind: 'doi', value: '10.1177/1941738116631498' }],
    ['https://journals.sagepub.com/doi/10.1177%2F1941738116631498', { kind: 'doi', value: '10.1177/1941738116631498' }],
    ['doi: 10.1016/j.cmet.2018.04.010.', { kind: 'doi', value: '10.1016/j.cmet.2018.04.010' }],
    ['https://pmc.ncbi.nlm.nih.gov/articles/PMC4981065/', { kind: 'pmcid', value: 'PMC4981065' }],
    ['https://pubmed.ncbi.nlm.nih.gov/26893309/', { kind: 'pmid', value: '26893309' }],
    ['PMID: 26893309', { kind: 'pmid', value: '26893309' }]
  ])('reads %s', (input, expected) => {
    expect(parsePaperIdentifier(input)).toEqual(expected);
  });

  it('returns null when there is no identifier', () => {
    expect(parsePaperIdentifier('https://example.com/some-blog-post')).toBeNull();
  });
});

describe('jatsToText', () => {
  it('keeps methods and tables, decodes entities and drops references', () => {
    const text = jatsToText(ASTYM_XML);
    expect(text).toContain('3 sets of 15 heel drops & stretches twice daily.');
    expect(text).toContain('1–12');
    expect(text).not.toContain('Alfredson');
    expect(text).not.toMatch(/<[^>]+>/);
  });
});

describe('resolvePaperSource', () => {
  it('returns the real title, citation and full text for an open-access DOI', async () => {
    const fetchMock = mockEuropePmc(ASTYM_RECORD, ASTYM_XML);
    const result = await resolvePaperSource('https://doi.org/10.1177/1941738116631498');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.paper.title).toMatch(/^Eccentric Exercise Versus Eccentric Exercise/);
    expect(result.paper.citation).toContain('Sports Health (2016)');
    expect(result.paper.fullText).toContain('3 sets of 15 heel drops');
    expect(fetchMock.mock.calls[0][0]).toContain('www.ebi.ac.uk/europepmc');
    expect(fetchMock.mock.calls[1][0]).toContain('/PMC4981065/fullTextXML');
  });

  it('reports no-full-text when the paper is not in PMC', async () => {
    mockEuropePmc({ ...ASTYM_RECORD, pmcid: undefined }, null);
    expect(await resolvePaperSource('10.1177/1941738116631498')).toEqual({ ok: false, reason: 'no-full-text' });
  });

  it('reports not-found for an unknown DOI', async () => {
    mockEuropePmc(null, null);
    expect(await resolvePaperSource('10.9999/does-not-exist')).toEqual({ ok: false, reason: 'not-found' });
  });

  it('never fetches the user-supplied URL itself', async () => {
    const fetchMock = mockEuropePmc(null, null);
    await resolvePaperSource('http://169.254.169.254/latest/meta-data/10.1234/abc');
    expect(fetchMock.mock.calls.every(([url]) => String(url).startsWith('https://www.ebi.ac.uk/'))).toBe(true);
  });
});

describe('extractPaperProtocol with a link', () => {
  it('asks for the PDF instead of calling Gemini when the full text is not available', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mockEuropePmc({ ...ASTYM_RECORD, pmcid: undefined }, null);

    const result = await extractPaperProtocol({ url: 'https://doi.org/10.1177/1941738116631498' });

    expect(result).toMatchObject({ success: false, eligible: false, rejectionReason: COPY.extraction.fullTextUnavailable });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('sends the fetched full text to Gemini, not just the link', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mockEuropePmc(ASTYM_RECORD, ASTYM_XML);
    generateContent.mockResolvedValue({ response: { text: () => JSON.stringify({ eligible: false, rejectionReason: 'stub' }) } });

    await extractPaperProtocol({ url: 'https://doi.org/10.1177/1941738116631498' });

    const prompt = (generateContent.mock.calls[0][0] as string[]).join('\n');
    expect(prompt).toContain('3 sets of 15 heel drops');
    expect(prompt).toContain('McCormack JR');
  });

  it('reports the model as busy instead of inventing a routine when Gemini fails', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mockEuropePmc(ASTYM_RECORD, ASTYM_XML);
    generateContent.mockRejectedValue(new Error('503 high demand'));

    const result = await extractPaperProtocol({ url: 'https://doi.org/10.1177/1941738116631498' });

    expect(result).toMatchObject({ success: false, eligible: false, rejectionReason: COPY.extraction.modelUnavailable });
    expect(result.routine).toBeUndefined();
  });

  it('declines an animal study by its resolved title without calling Gemini', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    mockEuropePmc(
      { ...ASTYM_RECORD, title: 'Weight Pulling: A Novel Mouse Model of Human Progressive Resistance Exercise', pmcid: 'PMC8465477' },
      ASTYM_XML
    );

    const result = await extractPaperProtocol({ url: '10.3389/fphys.2021.734879' });

    expect(result.eligible).toBe(false);
    expect(result.rejectionReason).toBe(COPY.extraction.declinedAnimalModel);
    expect(generateContent).not.toHaveBeenCalled();
  });
});
