import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../../app/api/papers/search/route';

describe('GET /api/papers/search', () => {
  beforeEach(() => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          resultList: {
            result: [
              {
                title: 'Eccentric heel drop trial.',
                authorString: 'Smith J.',
                journalTitle: 'Sports Med',
                pubYear: '2022',
                doi: '10.1234/example.5678',
                pmcid: 'PMC1234567'
              }
            ]
          }
        }),
        { status: 200 }
      );
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns community papers and external search links without query', async () => {
    const req = new Request('http://localhost/api/papers/search');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.communityPapers.length).toBeGreaterThan(0);
    expect(data.externalLinks).toBeDefined();
    expect(data.externalLinks.pubmed).toContain('pubmed.ncbi.nlm.nih.gov');
    expect(data.externalLinks.europePmc).toContain('europepmc.org');
  });

  it('filters community papers by keyword', async () => {
    const req = new Request('http://localhost/api/papers/search?q=achilles');
    const res = await GET(req);
    const data = await res.json();

    expect(data.communityPapers[0].id).toBe('achilles-rehab');
    expect(data.query).toBe('achilles');
  });

  it('calls Europe PMC when query is provided and parses records', async () => {
    const req = new Request('http://localhost/api/papers/search?q=creatine');
    const res = await GET(req);
    const data = await res.json();

    expect(data.externalPapers.length).toBe(1);
    expect(data.externalPapers[0].title).toBe('Eccentric heel drop trial');
    expect(data.externalPapers[0].doi).toBe('10.1234/example.5678');
  });
});

