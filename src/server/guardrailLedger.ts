/**
 * Google Cloud Firestore Guardrail Policy Ledger
 *
 * Implements centralized, continually updatable safety policies backed by Cloud Firestore.
 * Features an in-memory hot cache (1-min TTL) with zero-downtime fail-safe fallback
 * to baseline clinical rules when Firestore credentials are not configured.
 */

import { Firestore } from '@google-cloud/firestore';
import type {
  GuardrailPolicy,
  GuardrailUpdateRequest,
  GuardrailLedgerResponse
} from '../types/guardrails';
import {
  FEEDBACK_ESCALATION_THRESHOLD,
  LOAD_REDUCTION_PERCENT,
  PROGRESSION_WINDOW_LOGS,
  PROGRESSION_MAX_SCORE
} from '../data/config';
import { COPY } from '../data/copy';

const POLICY_COLLECTION = 'policies';
const POLICY_DOC_ID = 'clinical_guardrails';
const CACHE_TTL_MS = 60_000; // 1 minute hot cache

/** Hardcoded, immutable baseline policy guaranteeing safe operation even offline. */
export const BASELINE_GUARDRAIL_POLICY: GuardrailPolicy = {
  painEscalationThreshold: FEEDBACK_ESCALATION_THRESHOLD,
  loadReductionPercent: LOAD_REDUCTION_PERCENT,
  progressionWindowLogs: PROGRESSION_WINDOW_LOGS,
  progressionMaxPainScore: PROGRESSION_MAX_SCORE,
  bannedKeywords: [
    'in vitro',
    'in-vitro',
    'murine',
    'mouse',
    'rat model',
    'rabbit',
    'cell culture',
    'theoretical physics',
    'quantum',
    'cosmology',
    'astrophysics',
    'macroeconomics',
    'econometrics',
    'pure mathematics'
  ],
  clinicalDisclaimer: COPY.safety.clinicalDisclaimer,
  escalationAlertMessage: COPY.safety.baselineEscalationAlert,
  version: '2026.10-baseline',
  updatedAt: new Date().toISOString(),
  source: 'hardcoded-baseline'
};

// In-memory cache holding active policy across server requests
let cachedPolicy: GuardrailPolicy = { ...BASELINE_GUARDRAIL_POLICY };
let lastCacheSync = 0;
let firestoreInstance: Firestore | null = null;
let firestoreStatus: 'connected' | 'unconfigured' | 'error' = 'unconfigured';

/** Get or initialize Firestore singleton with fail-safe error handling. */
export function getFirestore(): Firestore | null {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.GCLOUD_PROJECT;
  const databaseId =
    process.env.FIRESTORE_DATABASE_ID ||
    process.env.GOOGLE_CLOUD_FIRESTORE_DATABASE;

  // If no GCP project ID is specified and not in an emulator, treat as unconfigured local dev
  if (!projectId && !process.env.FIRESTORE_EMULATOR_HOST) {
    firestoreStatus = 'unconfigured';
    return null;
  }

  try {
    firestoreInstance = new Firestore({
      projectId: projectId || undefined,
      databaseId: databaseId || undefined
    });
    firestoreStatus = 'connected';
    return firestoreInstance;
  } catch (err) {
    console.warn('[GuardrailLedger] Could not initialize Cloud Firestore, using fail-safe memory ledger:', err);
    firestoreStatus = 'error';
    return null;
  }
}

/**
 * Fetch the effective clinical guardrail policy.
 * Resolves from Firestore if connected, or gracefully returns in-memory cache.
 */
export async function getEffectiveGuardrails(): Promise<GuardrailPolicy> {
  const now = Date.now();
  if (now - lastCacheSync < CACHE_TTL_MS && cachedPolicy.source !== 'hardcoded-baseline') {
    return cachedPolicy;
  }

  const db = getFirestore();
  if (!db) {
    return cachedPolicy;
  }

  try {
    const docRef = db.collection(POLICY_COLLECTION).doc(POLICY_DOC_ID);
    const snapshot = await docRef.get();

    if (snapshot.exists) {
      const data = snapshot.data();
      cachedPolicy = {
        ...BASELINE_GUARDRAIL_POLICY,
        ...data,
        updatedAt: data?.updatedAt || new Date().toISOString(),
        source: 'firestore-live'
      };
      lastCacheSync = now;
      firestoreStatus = 'connected';
      return cachedPolicy;
    }

    // Document doesn't exist yet, seed initial baseline into Firestore
    await docRef.set({
      ...BASELINE_GUARDRAIL_POLICY,
      source: 'firestore-live',
      updatedAt: new Date().toISOString()
    });
    cachedPolicy = {
      ...BASELINE_GUARDRAIL_POLICY,
      source: 'firestore-live'
    };
    lastCacheSync = now;
    firestoreStatus = 'connected';
    return cachedPolicy;
  } catch (err) {
    console.warn('[GuardrailLedger] Firestore fetch error, falling back to cached ledger:', err);
    firestoreStatus = 'error';
    return cachedPolicy;
  }
}

/**
 * Update the active guardrail policy dynamically without redeploying code.
 * Persists directly to Cloud Firestore and updates local cache.
 */
export async function updateGuardrailPolicy(
  updates: GuardrailUpdateRequest
): Promise<GuardrailPolicy> {
  const now = new Date().toISOString();
  const db = getFirestore();

  const newPolicy: GuardrailPolicy = {
    ...cachedPolicy,
    ...updates,
    version: updates.version || `dynamic-${Date.now().toString(36)}`,
    updatedAt: now,
    source: db ? 'firestore-live' : 'memory-cache'
  };

  cachedPolicy = newPolicy;
  lastCacheSync = Date.now();

  if (db) {
    try {
      const docRef = db.collection(POLICY_COLLECTION).doc(POLICY_DOC_ID);
      await docRef.set(newPolicy, { merge: true });
      firestoreStatus = 'connected';
    } catch (err) {
      console.error('[GuardrailLedger] Failed to persist update to Firestore:', err);
      firestoreStatus = 'error';
    }
  }

  return cachedPolicy;
}

/** Reset policy to baseline clinical standards. */
export async function resetGuardrailPolicy(): Promise<GuardrailPolicy> {
  return updateGuardrailPolicy({
    ...BASELINE_GUARDRAIL_POLICY,
    version: '2026.10-baseline-reset'
  });
}

/** Inspect health status of the Firestore policy ledger. */
export async function getGuardrailLedgerStatus(): Promise<GuardrailLedgerResponse> {
  const policy = await getEffectiveGuardrails();
  return {
    policy,
    isLiveFirestore: policy.source === 'firestore-live',
    firestoreStatus,
    lastSyncedAt: new Date(lastCacheSync || Date.now()).toISOString()
  };
}
