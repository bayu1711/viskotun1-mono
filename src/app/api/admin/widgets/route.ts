import { NextResponse } from 'next/server';
import { COPY } from '../../../../data/copy';
import { injectApprovedWidgetIntoCanonicalProtocol } from '../../../../server/routineRegistry';
import { approveWidgetProposal, listWidgetProposals } from '../../../../server/widgetRegistry';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proposals = await listWidgetProposals();
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('[AdminWidgetsAPI] Failed to list widget proposals:', error);
    return NextResponse.json(
      { error: COPY.api.widgets.fetchError },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const proposalId = typeof body?.proposalId === 'string' ? body.proposalId.trim() : '';

    if (!proposalId) {
      return NextResponse.json(
        { error: COPY.api.widgets.proposalIdRequired },
        { status: 400 }
      );
    }

    const approved = await approveWidgetProposal(proposalId);
    if (!approved) {
      return NextResponse.json(
        { error: COPY.api.widgets.notFound },
        { status: 404 }
      );
    }

    const updatedProtocol = await injectApprovedWidgetIntoCanonicalProtocol(approved);

    return NextResponse.json({
      message: COPY.api.widgets.approveSuccess,
      proposal: approved,
      protocol: updatedProtocol
    });
  } catch (error) {
    console.error('[AdminWidgetsAPI] Failed to approve widget proposal:', error);
    return NextResponse.json(
      { error: COPY.api.widgets.approveError },
      { status: 500 }
    );
  }
}
