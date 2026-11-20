import { NextResponse } from 'next/server';
import { COPY } from '../../../../data/copy';
import { injectApprovedWidgetIntoCanonicalRoutine } from '../../../../server/routineRegistry';
import { approveWidgetProposal, listWidgetProposals } from '../../../../server/widgetRegistry';
import { requireAdmin } from '../../../../server/auth';
import { errorResponse, readJsonBody } from '../../../../server/http';

export const dynamic = 'force-dynamic';

/** GET: Pending and approved AI widget proposals (admin only) */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const proposals = await listWidgetProposals();
    return NextResponse.json({ proposals });
  } catch (error) {
    return errorResponse('AdminWidgetsRoute.GET', error, COPY.api.widgets.fetchError);
  }
}

/** POST: Approve one widget proposal (admin only) */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await readJsonBody<{ proposalId?: unknown }>(request);
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

    const updatedRoutine = await injectApprovedWidgetIntoCanonicalRoutine(approved);

    return NextResponse.json({
      message: COPY.api.widgets.approveSuccess,
      proposal: approved,
      routine: updatedRoutine
    });
  } catch (error) {
    return errorResponse('AdminWidgetsRoute.POST', error, COPY.api.widgets.approveError);
  }
}
