/**
 * Google Cloud Firestore Guardrail Policy Ledger
 *
 * Implements centralized, continually updatable safety policies backed by Cloud Firestore.
 * Features an in-memory hot cache (1-min TTL) with zero-downtime fail-safe fallback
 * to baseline clinical rules when Firestore credentials are not configured.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
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

/**
 * Detect whether valid Google Cloud credentials or emulator are available.
 * Prevents throwing NO_ADC_FOUND errors when only GOOGLE_CLOUD_PROJECT is specified in local dev.
 */
function hasFirestoreCredentials(): boolean {
  // 1. Explicit emulator host configured
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return true;
  }

  // 2. Explicit service account JSON file path
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  ) {
    return true;
  }

  // 3. Raw or base64-encoded service account key in environment
  if (
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.GCP_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ) {
    return true;
  }

  // 4. Managed Google Cloud environment (Cloud Run, Cloud Functions, GAE, GCE)
  if (
    process.env.K_SERVICE ||
    process.env.FUNCTION_TARGET ||
    process.env.GAE_ENV ||
    process.env.CLOUD_RUN_JOB
  ) {
    return true;
  }

  // 5. Well-known local Application Default Credentials (created by `gcloud auth application-default login`)
  try {
    const defaultAdcPath =
      process.platform === 'win32'
        ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
        : path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');

    if (fs.existsSync(defaultAdcPath)) {
      return true;
    }
  } catch {
    // Filesystem access restricted or error
  }

  return false;
}

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

  // If no credentials or emulator are available, fail-safe to unconfigured local memory ledger
  if (!hasFirestoreCredentials()) {
    firestoreStatus = 'unconfigured';
    return null;
  }

  try {
    let credentials: any = undefined;
    const rawCredentials =
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
      process.env.GCP_SERVICE_ACCOUNT_KEY ||
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (rawCredentials) {
      try {
        const trimmed = rawCredentials.trim();
        const jsonStr = trimmed.startsWith('{')
          ? trimmed
          : Buffer.from(trimmed, 'base64').toString('utf-8');
        credentials = JSON.parse(jsonStr);
      } catch (parseErr) {
        console.warn('[GuardrailLedger] Could not parse inline service account JSON credentials:', parseErr);
      }
    }

    firestoreInstance = new Firestore({
      projectId: projectId || undefined,
      databaseId: databaseId || undefined,
      credentials: credentials || undefined
    });
    firestoreStatus = 'connected';
    return firestoreInstance;
  } catch (err: any) {
    console.warn('[GuardrailLedger] Could not initialize Cloud Firestore, using fail-safe memory ledger:', err?.message || err);
    firestoreStatus = 'error';
    firestoreInstance = null;
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
  } catch (err: any) {
    console.warn('[GuardrailLedger] Firestore unavailable, falling back to cached ledger:', err?.message || err);
    firestoreStatus = 'error';
    firestoreInstance = null;
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
    } catch (err: any) {
      console.warn('[GuardrailLedger] Failed to persist update to Firestore, falling back to memory cache:', err?.message || err);
      firestoreStatus = 'error';
      firestoreInstance = null;
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
