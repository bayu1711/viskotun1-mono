import { NextResponse } from 'next/server';
import { getSamplePapers, savePaper, getUserPapers, seedSamplePapersIfEmpty } from '../../../server/papersStorage';
import { saveCanonicalRoutine } from '../../../server/routineRegistry';
import { getExtractionCandidate } from '../../../server/candidateStore';
import { registerRoutineWidgetProposals } from '../../../server/widgetRegistry';
import { getRequestUser, requireAdmin, unauthorizedResponse } from '../../../server/auth';
import { errorResponse, readJsonBody } from '../../../server/http';
import { logEvent } from '../../../server/log';
import { COPY } from '../../../data/copy';
import type { RoutineStep, StoredPaper } from '../../../types/routine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET: the public sample/trending catalog, or (`?mine=1`, signed in) the caller's own papers.
 * A `userId` query parameter is no longer accepted: one user cannot list another's papers.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.has('mine') || searchParams.has('userId')) {
      const user = await getRequestUser(request);
      if (!user) return unauthorizedResponse();
      const papers = await getUserPapers(user.uid);
      return NextResponse.json({ papers });
    }

    const result = await getSamplePapers();
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse('PapersRoute.GET', error, COPY.api.papers.fetchError);
  }
}

/**
 * POST `{ candidateId }`: the signed-in user confirms an extraction.
 *
 * The routine comes from the server's stored copy of that extraction, never from the
 * request body. Only routines built from Europe PMC full text (fetched by the server)
 * become the shared canonical routine for their paper; uploaded PDFs and pasted text stay
 * private to the user, because their content cannot be verified.
 *
 * POST `{ action: 'seed' }` (admin only) seeds the sample catalog.
 */
export async function POST(request: Request) {
  const body = await readJsonBody<{ action?: unknown; candidateId?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: COPY.api.assistant.invalidJson }, { status: 400 });
  }

  if (body.action === 'seed') {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) return admin;
    try {
      const seeded = await seedSamplePapersIfEmpty();
      return NextResponse.json({ success: true, seeded, message: COPY.api.papers.seedSuccess });
    } catch (error) {
      return errorResponse('PapersRoute.seed', error, COPY.api.papers.saveError);
    }
  }

  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();

  const candidateId = typeof body.candidateId === 'string' ? body.candidateId : '';
  if (!candidateId) {
    return NextResponse.json({ error: COPY.api.papers.candidateRequired }, { status: 400 });
  }

  try {
    const candidate = await getExtractionCandidate(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: COPY.api.papers.candidateNotFound }, { status: 404 });
    }

    const routine = candidate.routine;
    await registerRoutineWidgetProposals(routine);

    const isShared = candidate.sourceKind === 'europe-pmc' || candidate.sourceKind === 'catalog';
    if (candidate.sourceKind === 'europe-pmc') {
      await saveCanonicalRoutine(routine);
    }

    const paperDocument: StoredPaper = {
      id: `${user.uid}__${routine.id}`.slice(0, 300),
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
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = await savePaper(paperDocument);
    logEvent('paper_confirmed', { sourceKind: candidate.sourceKind, shared: isShared });

    return NextResponse.json({
      success: true,
      source: result.source,
      shared: isShared,
      message: COPY.api.papers.saveSuccess,
      paperId: paperDocument.id,
      routineId: routine.id
    });
  } catch (error) {
    return errorResponse('PapersRoute.POST', error, COPY.api.papers.saveError);
  }
}
