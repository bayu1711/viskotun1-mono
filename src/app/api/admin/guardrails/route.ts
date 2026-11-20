import { NextResponse } from 'next/server';
import {
  getGuardrailLedgerStatus,
  updateGuardrailPolicy,
  resetGuardrailPolicy
} from '../../../../server/guardrailLedger';
import type { GuardrailUpdateRequest } from '../../../../types/guardrails';
import { COPY } from '../../../../data/copy';
import { requireAdmin } from '../../../../server/auth';
import { errorResponse, readJsonBody } from '../../../../server/http';

export const dynamic = 'force-dynamic';

/**
 * GET: Inspect the live guardrail policy. Public on purpose: every client applies the
 * active pain threshold, and the policy holds no personal data.
 */
export async function GET() {
  try {
    const status = await getGuardrailLedgerStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[AdminGuardrailsRoute] GET error:', error);
    return NextResponse.json(
      { error: COPY.api.guardrails.retrieveError },
      { status: 500 }
    );
  }
}

/** POST: Update safety thresholds and gatekeeper rules (admin only) */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await readJsonBody<GuardrailUpdateRequest>(request);
    if (!body) {
      return NextResponse.json({ error: COPY.api.assistant.invalidJson }, { status: 400 });
    }

    if (body.painEscalationThreshold !== undefined) {
      if (
        typeof body.painEscalationThreshold !== 'number' ||
        body.painEscalationThreshold < 1 ||
        body.painEscalationThreshold > 10
      ) {
        return NextResponse.json(
          { error: COPY.api.guardrails.invalidThreshold },
          { status: 400 }
        );
      }
    }

    if (body.loadReductionPercent !== undefined) {
      if (
        typeof body.loadReductionPercent !== 'number' ||
        body.loadReductionPercent < 5 ||
        body.loadReductionPercent > 90
      ) {
        return NextResponse.json(
          { error: COPY.api.guardrails.invalidReduction },
          { status: 400 }
        );
      }
    }

    const updated = await updateGuardrailPolicy(body, auth.email || auth.uid);
    const status = await getGuardrailLedgerStatus();

    return NextResponse.json({
      success: true,
      message: COPY.api.guardrails.updatedSuccess,
      policy: updated,
      isLiveFirestore: status.isLiveFirestore,
      firestoreStatus: status.firestoreStatus
    });
  } catch (error) {
    return errorResponse('AdminGuardrailsRoute.POST', error, COPY.api.guardrails.updateError);
  }
}

/** DELETE: Reset policy ledger to baseline clinical standards (admin only) */
export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const reset = await resetGuardrailPolicy();
    const status = await getGuardrailLedgerStatus();

    return NextResponse.json({
      success: true,
      message: COPY.api.guardrails.resetSuccess,
      policy: reset,
      isLiveFirestore: status.isLiveFirestore,
      firestoreStatus: status.firestoreStatus
    });
  } catch (error) {
    return errorResponse('AdminGuardrailsRoute.DELETE', error, COPY.api.guardrails.resetError);
  }
}
