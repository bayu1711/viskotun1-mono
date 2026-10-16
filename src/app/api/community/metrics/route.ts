import { NextResponse } from 'next/server';
import { getCommunityMetrics } from '../../../../server/protocolRegistry';
import { COPY } from '../../../../data/copy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');

    if (!protocolId) {
      return NextResponse.json(
        { error: COPY.api.community.protocolIdRequired },
        { status: 400 }
      );
    }

    const metrics = await getCommunityMetrics(protocolId);

    return NextResponse.json({
      success: true,
      protocolId,
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
