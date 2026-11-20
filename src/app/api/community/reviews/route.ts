import { NextResponse } from 'next/server';
import {
  getCommunityReviews,
  addCommunityReview,
  getCommunityMetrics
} from '../../../../server/routineRegistry';
import { COPY } from '../../../../data/copy';
import type { ReviewOutcome } from '../../../../types/routine';
import { requireUser } from '../../../../server/auth';
import { enforceRateLimit } from '../../../../server/rateLimit';
import { cleanText, errorResponse, readJsonBody } from '../../../../server/http';

const MAX_REVIEW_LENGTH = 1_000;
const MAX_HANDLE_LENGTH = 40;
const MAX_TAGS = 10;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routineId = searchParams.get('routineId');

    if (!routineId) {
      return NextResponse.json(
        { error: COPY.api.community.routineIdRequired },
        { status: 400 }
      );
    }

    const reviews = await getCommunityReviews(routineId);
    const metrics = await getCommunityMetrics(routineId);

    return NextResponse.json({
      success: true,
      routineId,
      reviews,
      metrics
    });
  } catch (error) {
    console.error('[CommunityReviewsRoute] GET error:', error);
    return NextResponse.json(
      { error: COPY.api.community.fetchError },
      { status: 500 }
    );
  }
}

const VALID_OUTCOMES: Set<ReviewOutcome> = new Set(['improved', 'adjusted', 'paused']);

/**
 * POST: Add or replace the signed-in user's review for a routine.
 * The author is taken from the ID token, so a review cannot be posted as someone else,
 * and each user has one review per routine.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const limited = enforceRateLimit('reviews', request, auth);
  if (limited) return limited;

  try {
    const body = await readJsonBody<Record<string, unknown>>(request);
    if (!body) {
      return NextResponse.json({ error: COPY.api.assistant.invalidJson }, { status: 400 });
    }

    const routineId = cleanText(body.routineId, 200);
    if (!routineId) {
      return NextResponse.json({ error: COPY.api.community.routineIdRequired }, { status: 400 });
    }

    const outcome = body.outcome as ReviewOutcome;
    if (!outcome || !VALID_OUTCOMES.has(outcome)) {
      return NextResponse.json({ error: COPY.api.community.invalidOutcome }, { status: 400 });
    }

    if (typeof body.text !== 'string' || body.text.trim().length === 0) {
      return NextResponse.json({ error: COPY.api.community.textRequired }, { status: 400 });
    }
    if (body.text.length > MAX_REVIEW_LENGTH) {
      return NextResponse.json({ error: COPY.api.community.textTooLong(MAX_REVIEW_LENGTH) }, { status: 400 });
    }

    const day = Math.min(Math.max(Math.round(Number(body.day) || 1), 1), 3650);
    const adherence = Math.min(Math.max(Math.round(Number(body.adherence) || 0), 0), 100);
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === 'string').map((t) => t.slice(0, 40)).slice(0, MAX_TAGS)
      : undefined;
    const lifestyleCohort = cleanText(body.lifestyleCohort, 80) || undefined;

    const review = await addCommunityReview(
      routineId,
      {
        handle: cleanText(body.handle, MAX_HANDLE_LENGTH) || undefined,
        outcome,
        day,
        adherence,
        text: body.text.trim(),
        ...(lifestyleCohort ? { lifestyleCohort } : {}),
        ...(tags ? { tags } : {})
      } as Parameters<typeof addCommunityReview>[1],
      auth.uid
    );

    const metrics = await getCommunityMetrics(routineId);

    return NextResponse.json({
      success: true,
      message: COPY.api.community.saveSuccess,
      review,
      metrics
    });
  } catch (error) {
    return errorResponse('CommunityReviewsRoute.POST', error, COPY.api.community.saveError);
  }
}
