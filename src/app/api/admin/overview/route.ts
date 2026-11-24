import { NextResponse } from 'next/server';
import { LEGAL_DOCUMENTS } from '@/data/legal';
import { SAMPLE_PAPERS } from '@/data/samplePapers';
import { getFirebaseProjectId } from '@/server/auth';
import { getGuardrailLedgerStatus } from '@/server/guardrailLedger';
import { listWidgetProposals } from '@/server/widgetRegistry';

export const dynamic = 'force-dynamic';

/**
 * GET: Aggregated live telemetry for the /admin Clinical Governance Console.
 * Exposes non-sensitive operational status, guardrail policy state, and widget queue counts.
 */
export async function GET() {
  try {
    const [guardrails, proposals] = await Promise.all([
      getGuardrailLedgerStatus(),
      listWidgetProposals()
    ]);

    const pendingWidgets = proposals.filter((p) => p.status === 'pending_review').length;
    const approvedWidgets = proposals.filter((p) => p.status === 'approved').length;

    const aiProviderConfigured = Boolean(
      process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCP_PROJECT_ID ||
        process.env.VERTEX_PROJECT_ID
    );

    return NextResponse.json({
      guardrails,
      proposals,
      counts: {
        pendingWidgets,
        approvedWidgets,
        totalWidgets: proposals.length,
        bannedKeywords: guardrails.policy.bannedKeywords?.length ?? 0,
        curatedPapers: SAMPLE_PAPERS.length,
        legalDocuments: LEGAL_DOCUMENTS.length
      },
      runtime: {
        firebaseProjectId: getFirebaseProjectId(),
        aiProviderConfigured,
        firestoreStatus: guardrails.firestoreStatus,
        isLiveFirestore: guardrails.isLiveFirestore,
        serverTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[AdminOverviewAPI] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load admin console telemetry.' },
      { status: 500 }
    );
  }
}
