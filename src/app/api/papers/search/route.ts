import { NextResponse } from 'next/server';
import { SAMPLE_PAPERS } from '../../../../data/samplePapers';
import { buildExternalSearchLinks, matchCommunityPapers } from '../../../../utils/paperQuery';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EUROPE_PMC_API = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const REQUEST_TIMEOUT_MS = 6000;

interface EuropePmcSearchItem {
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  doi?: string;
  pmcid?: string;
  pmid?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim();

    // 1. Community papers (instant matching)
    const communityPapers = matchCommunityPapers(query, SAMPLE_PAPERS);

    // 2. Pre-filtered external search links (PubMed, Europe PMC, Google Scholar)
    const externalLinks = buildExternalSearchLinks(query);

    // 3. Live Europe PMC open-access trial search if query provided
    let externalPapers: {
      title: string;
      authors: string;
      journal: string;
      year: number;
      doi: string;
      pmcid?: string;
      pmid?: string;
    }[] = [];

    if (query.length > 1) {
      try {
        const searchUrl = `${EUROPE_PMC_API}/search?query=${encodeURIComponent(
          `${query} AND OPEN_ACCESS:y AND (SRC:MED OR HAS_PDF:y)`
        )}&format=json&resultType=lite&pageSize=4`;

        const res = await fetch(searchUrl, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (res.ok) {
          const data = await res.json();
          const items: EuropePmcSearchItem[] = data?.resultList?.result || [];
          externalPapers = items
            .filter((item) => item.title && (item.doi || item.pmcid))
            .map((item) => ({
              title: (item.title || '').replace(/\.$/, ''),
              authors: item.authorString || 'Researchers',
              journal: item.journalTitle || 'Clinical Study',
              year: item.pubYear ? parseInt(item.pubYear, 10) : new Date().getFullYear(),
              doi: item.doi || (item.pmcid ? `PMC:${item.pmcid}` : ''),
              pmcid: item.pmcid,
              pmid: item.pmid
            }));
        }
      } catch (err) {
        console.warn('[/api/papers/search] Europe PMC live lookup bypassed:', err);
      }
    }

    return NextResponse.json({
      query,
      communityPapers,
      externalPapers,
      externalLinks
    });
  } catch (error) {
    console.error('[/api/papers/search] Search failed:', error);
    return NextResponse.json(
      {
        query: '',
        communityPapers: SAMPLE_PAPERS.filter((p) => !p.isGuardrailRejectionTest),
        externalPapers: [],
        externalLinks: buildExternalSearchLinks('')
      },
      { status: 200 }
    );
  }
}
