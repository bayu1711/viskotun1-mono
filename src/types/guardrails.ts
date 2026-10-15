/**
 * Google Cloud Firestore Clinical Guardrail Policy Contracts
 */

export interface GuardrailPolicy {
  /** Pain score (0-10) above which protocol progression is paused. */
  painEscalationThreshold: number;
  /** Percent load/dose reduction recommended when threshold is exceeded. */
  loadReductionPercent: number;
  /** Number of consecutive sessions required below max pain to trigger escalation. */
  progressionWindowLogs: number;
  /** Maximum allowable pain score during the progression window. */
  progressionMaxPainScore: number;
  /** Banned keywords for immediate study gatekeeper rejection. */
  bannedKeywords: string[];
  /** Non-negotiable medical/clinical safety advisory text. */
  clinicalDisclaimer: string;
  /** Dynamic escalation alert text presented to patient upon adverse threshold. */
  escalationAlertMessage: string;
  /** Active policy schema version identifier. */
  version: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
  /** Data provenance source indicating where the active policy was resolved from. */
  source: 'firestore-live' | 'memory-cache' | 'hardcoded-baseline';
}

export type GuardrailUpdateRequest = Partial<
  Omit<GuardrailPolicy, 'source' | 'updatedAt'>
>;

export interface GuardrailLedgerResponse {
  policy: GuardrailPolicy;
  isLiveFirestore: boolean;
  firestoreStatus: 'connected' | 'unconfigured' | 'error';
  lastSyncedAt: string;
}
