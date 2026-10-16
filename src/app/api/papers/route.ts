import { NextResponse } from 'next/server';
import { getSamplePapers, savePaper, getUserPapers, seedSamplePapersIfEmpty } from '../../../server/papersStorage';
import { COPY } from '../../../data/copy';
import type { StoredPaper } from '../../../types/routine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    if (userId) {
      const papers = await getUserPapers(userId);
      return NextResponse.json({ papers });
    }

    // Default: return sample research papers and pre-calibrated protocols
    const result = await getSamplePapers();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Papers fetch error:', error);
    return NextResponse.json({ error: COPY.api.papers.fetchError }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'seed') {
      const seeded = await seedSamplePapersIfEmpty();
      return NextResponse.json({ success: true, seeded, message: COPY.api.papers.seedSuccess });
    }

    const { paper, protocol } = body;
    if (!paper) {
      return NextResponse.json({ error: COPY.api.papers.paperRequired }, { status: 400 });
    }

    const paperDocument: StoredPaper = {
      id: paper.id,
      title: paper.title,
      shortTitle: paper.shortTitle || paper.title,
      domain: paper.domain || 'Clinical Research',
      category: paper.category || 'rehab',
      authors: paper.authors || 'Unknown Authors',
      journal: paper.journal || 'Clinical Trial',
      year: paper.year || new Date().getFullYear(),
      doi: paper.doi || '',
      pmcId: paper.pmcId,
      openAccessUrl: paper.openAccessUrl || '',
      pdfUrl: paper.pdfUrl || '',
      summary: paper.summary || '',
      featuresTested: paper.featuresTested || [],
      routineId: paper.routineId || paper.protocolId || paper.id,
      protocolId: paper.routineId || paper.protocolId || paper.id,
      isSample: Boolean(paper.isSample),
      isGuardrailRejectionTest: Boolean(paper.isGuardrailRejectionTest),
      routine: (protocol || paper.routine) || undefined,
      protocol: (protocol || paper.protocol) || undefined,
      userId: paper.userId || null,
      createdAt: paper.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    const result = await savePaper(paperDocument);
    return NextResponse.json({
      success: true,
      source: result.source,
      message: COPY.api.papers.saveSuccess,
      paperId: paperDocument.id
    });
  } catch (error) {
    console.error('Paper save error:', error);
    return NextResponse.json({ error: COPY.api.papers.saveError }, { status: 500 });
  }
}
