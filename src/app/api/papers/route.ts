import { NextResponse } from 'next/server';
import { getSamplePapers, savePaper, getUserPapers, seedSamplePapersIfEmpty } from '../../../server/papersStorage';
import { saveCanonicalRoutine } from '../../../server/routineRegistry';
import { getExtractionCandidate } from '../../../server/candidateStore';
import { registerRoutineWidgetProposals } from '../../../server/widgetRegistry';
import { COPY } from '../../../data/copy';
import type { RoutineStep, StoredPaper } from '../../../types/routine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const papers = await getUserPapers(userId);
      return NextResponse.json({ papers });
    }

    // Default: return sample research papers and pre-calibrated routines
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

    // 1. Candidate-based confirmation (prevents client-side routine poisoning)
    if (body.candidateId) {
      const candidate = await getExtractionCandidate(body.candidateId);
      if (!candidate) {
        return NextResponse.json({ error: COPY.api.papers.candidateNotFound }, { status: 404 });
      }

      const routine = candidate.routine;
      await registerRoutineWidgetProposals(routine);

      const isShared = candidate.sourceKind === 'europe-pmc' || candidate.sourceKind === 'catalog';
      if (candidate.sourceKind === 'europe-pmc') {
        await saveCanonicalRoutine(routine);
      }

      const userId = body.userId || candidate.createdBy || null;
      const paperDocument: StoredPaper = {
        id: userId ? `${userId}__${routine.id}`.slice(0, 300) : routine.id,
        title: routine.paper?.title || routine.title,
        shortTitle: routine.shortTitle || routine.title,
        domain: routine.phase || 'Clinical Research',
        category: 'rehab',
        authors: routine.paper?.authors || 'Unknown Authors',
        journal: routine.paper?.journal || 'Clinical Trial',
        year: routine.paper?.year || new Date().getFullYear(),
        doi: routine.paper?.doi || '',
        openAccessUrl: routine.paper?.doi ? `https://doi.org/${routine.paper.doi}` : '',
        pdfUrl: '',
        summary: routine.steps?.map((s: RoutineStep) => s.action).join('. ') || '',
        featuresTested: routine.steps?.map((s: RoutineStep) => s.action) || [],
        routineId: routine.id,
        isSample: false,
        isGuardrailRejectionTest: false,
        popularityScore: 10,
        activeTrackersCount: 0,
        totalLogsCount: 0,
        routine,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const result = await savePaper(paperDocument);

      return NextResponse.json({
        success: true,
        source: result.source,
        shared: isShared,
        message: COPY.api.papers.saveSuccess,
        paperId: paperDocument.id,
        routineId: routine.id
      });
    }

    // 2. Legacy paper object fallback
    const { paper, routine } = body;
    if (!paper) {
      return NextResponse.json({ error: COPY.api.papers.paperRequired }, { status: 400 });
    }

    const targetRoutine = routine || paper.routine;
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
      routineId: paper.routineId || paper.id,
      isSample: Boolean(paper.isSample),
      isGuardrailRejectionTest: Boolean(paper.isGuardrailRejectionTest),
      popularityScore: paper.popularityScore ?? (paper.isSample ? 90 : 10),
      activeTrackersCount: paper.activeTrackersCount ?? 0,
      totalLogsCount: paper.totalLogsCount ?? 0,
      trendingRank: paper.trendingRank,
      routine: targetRoutine || undefined,
      userId: paper.userId || null,
      createdAt: paper.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    const result = await savePaper(paperDocument);

    // The user confirmed this routine, so it may now become the shared canonical entry for its paper
    if (paperDocument.routine) {
      await saveCanonicalRoutine(paperDocument.routine).catch((err) => {
        console.warn('[/api/papers] Could not register canonical routine:', err);
      });
    }

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
