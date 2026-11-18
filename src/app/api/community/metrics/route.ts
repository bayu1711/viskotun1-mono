import { NextResponse } from 'next/server';
import { getCommunityMetrics } from '../../../../server/routineRegistry';
import { COPY } from '../../../../data/copy';

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

    const metrics = await getCommunityMetrics(routineId);

    return NextResponse.json({
      success: true,
      routineId,
      metrics
    });
  } catch (error) {
    console.error('[CommunityMetricsRoute] GET error:', error);
    return NextResponse.json(
      { error: COPY.api.community.fetchError },
      { status: 500 }
    );
  }
}
