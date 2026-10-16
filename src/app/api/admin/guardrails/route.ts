import { NextResponse } from 'next/server';
import {
  getGuardrailLedgerStatus,
  updateGuardrailPolicy,
  resetGuardrailPolicy
} from '../../../../server/guardrailLedger';
import type { GuardrailUpdateRequest } from '../../../../types/guardrails';
import { COPY } from '../../../../data/copy';

/** GET: Inspect live guardrail policy and Cloud Firestore ledger status */
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

/** POST: Dynamically update safety thresholds and gatekeeper rules */
export async function POST(request: Request) {
  try {
    const body: GuardrailUpdateRequest = await request.json();

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

    const updated = await updateGuardrailPolicy(body);
    const status = await getGuardrailLedgerStatus();

    return NextResponse.json({
      success: true,
      message: COPY.api.guardrails.updatedSuccess,
      policy: updated,
      isLiveFirestore: status.isLiveFirestore,
      firestoreStatus: status.firestoreStatus
    });
  } catch (error) {
    console.error('[AdminGuardrailsRoute] POST error:', error);
    return NextResponse.json(
      { error: COPY.api.guardrails.updateError },
      { status: 500 }
    );
  }
}

/** DELETE: Reset policy ledger to baseline clinical standards */
export async function DELETE() {
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
    console.error('[AdminGuardrailsRoute] DELETE error:', error);
    return NextResponse.json(
      { error: COPY.api.guardrails.resetError },
      { status: 500 }
    );
  }
}
