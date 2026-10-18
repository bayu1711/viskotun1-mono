import { normalizeDoi } from '../utils/paperFingerprint';

/**
 * Resolves a DOI / PubMed / PMC reference to the paper's real open-access full text via Europe PMC.
 * Only this fixed host is contacted: user-supplied URLs are parsed for identifiers, never fetched.
 */
const EUROPE_PMC_API = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_FULL_TEXT_CHARS = 150000;

export interface PaperIdentifier {
  kind: 'doi' | 'pmid' | 'pmcid';
  value: string;
}

export interface ResolvedPaper {
  identifier: PaperIdentifier;
  title: string;
  doi?: string;
  citation: string;
  fullText: string;
}

export type PaperResolution =
  | { ok: true; paper: ResolvedPaper }
  | { ok: false; reason: 'unrecognized' | 'not-found' | 'no-full-text' };

interface EuropePmcResult {
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  doi?: string;
  pmid?: string;
  pmcid?: string;
}

export function parsePaperIdentifier(input: string): PaperIdentifier | null {
  let text = input;
  try {
    text = decodeURIComponent(input);
  } catch {
    // Keep the raw input when it is not valid URI encoding
  }

  const pmcid = text.match(/\bPMC\d+\b/i);
  if (pmcid) return { kind: 'pmcid', value: pmcid[0].toUpperCase() };

  const doiMatch = text.match(/10\.\d{4,9}\/[^\s"<>?#]+/i);
  const doi = doiMatch ? normalizeDoi(doiMatch[0].replace(/[.,;)\]]+$/, '')) : null;
  if (doi) return { kind: 'doi', value: doi };

  const pmid =
    text.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{1,9})/i) || text.match(/^\s*(?:pmid:?\s*)?(\d{5,9})\s*$/i);
  if (pmid) return { kind: 'pmid', value: pmid[1] };

  return null;
}

function searchQuery(id: PaperIdentifier): string {
  if (id.kind === 'doi') return `DOI:"${id.value}"`;
  if (id.kind === 'pmid') return `EXT_ID:${id.value} AND SRC:MED`;
  return `PMCID:${id.value}`;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Flattens JATS article XML to readable text. Drops the reference list; keeps tables, which often hold dosing. */
export function jatsToText(xml: string): string {
  const text = xml
    .replace(/<ref-list\b[\s\S]*?<\/ref-list>/gi, ' ')
    .replace(/<\/(?:p|title|sec|tr|caption|abstract|article-title)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(text)
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
    .slice(0, MAX_FULL_TEXT_CHARS);
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  return res.ok ? ((await res.json()) as T) : null;
}

export async function resolvePaperSource(input: string): Promise<PaperResolution> {
  const identifier = parsePaperIdentifier(input);
  if (!identifier) return { ok: false, reason: 'unrecognized' };

  const search = await getJson<{ resultList?: { result?: EuropePmcResult[] } }>(
    `${EUROPE_PMC_API}/search?query=${encodeURIComponent(searchQuery(identifier))}&format=json&resultType=lite&pageSize=1`
  );
  const record = search?.resultList?.result?.[0];
  if (!record?.title) return { ok: false, reason: 'not-found' };
  if (!record.pmcid) return { ok: false, reason: 'no-full-text' };

  const xmlRes = await fetch(`${EUROPE_PMC_API}/${record.pmcid}/fullTextXML`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!xmlRes.ok) return { ok: false, reason: 'no-full-text' };

  const fullText = jatsToText(await xmlRes.text());
  if (!fullText) return { ok: false, reason: 'no-full-text' };

  const title = record.title.replace(/\.$/, '');
  const citation = [
    title,
    record.authorString?.replace(/\.$/, ''),
    [record.journalTitle, record.pubYear && `(${record.pubYear})`].filter(Boolean).join(' '),
    record.doi && `doi:${record.doi}`,
    record.pmcid
  ]
    .filter(Boolean)
    .join('. ');

  return { ok: true, paper: { identifier, title, doi: record.doi, citation, fullText } };
}
