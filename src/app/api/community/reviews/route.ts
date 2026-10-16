import { NextResponse } from 'next/server';
import {
  getCommunityReviews,
  addCommunityReview,
  getCommunityMetrics
} from '../../../../server/protocolRegistry';
import { COPY } from '../../../../data/copy';
import type { ReviewOutcome } from '../../../../types/protocol';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const routineId = searchParams.get('routineId') || searchParams.get('protocolId');

    if (!routineId) {
      return NextResponse.json(
        { error: COPY.api.community.protocolIdRequired },
        { status: 400 }
      );
    }

    const reviews = await getCommunityReviews(routineId);
    const metrics = await getCommunityMetrics(routineId);

    return NextResponse.json({
      success: true,
      routineId,
      protocolId: routineId,
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const routineId = body.routineId || body.protocolId;
    const { handle, outcome, day, adherence, text, userId } = body;

    if (!routineId) {
      return NextResponse.json(
        { error: COPY.api.community.protocolIdRequired },
        { status: 400 }
      );
    }

    if (!outcome || !VALID_OUTCOMES.has(outcome as ReviewOutcome)) {
      return NextResponse.json(
        { error: COPY.api.community.invalidOutcome },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: COPY.api.community.textRequired },
        { status: 400 }
      );
    }

    const review = await addCommunityReview(
      routineId,
      {
        handle: handle || undefined,
        outcome: outcome as ReviewOutcome,
        day: Number(day) || 1,
        adherence: Number(adherence) || 100,
        text
      },
      userId
    );

    const metrics = await getCommunityMetrics(routineId);

    return NextResponse.json({
      success: true,
      message: COPY.api.community.saveSuccess,
      review,
      metrics
    });
  } catch (error) {
    console.error('[CommunityReviewsRoute] POST error:', error);
    return NextResponse.json(
      { error: COPY.api.community.saveError },
      { status: 500 }
    );
  }
}
