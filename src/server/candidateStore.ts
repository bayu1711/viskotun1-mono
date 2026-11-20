/**
 * Server-side copies of unconfirmed extractions ("candidates").
 *
 * `/api/extract` stores the routine it produced and returns a `candidateId`. When the user
 * confirms, `/api/papers` loads this stored copy. Routine content from the browser is never
 * accepted for the shared catalog, so a client cannot publish an edited routine for a paper.
 */

import { randomUUID } from 'crypto';
import { getFirestore } from './guardrailLedger';
import { logWarning } from './log';
import type { ExtractionSourceKind } from './geminiExtraction';
import type { Routine } from '../types/routine';

const CANDIDATES_COLLECTION = 'extraction_candidates';
const CANDIDATE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_MEMORY_CANDIDATES = 500;

export interface ExtractionCandidate {
  id: string;
  routine: Routine;
  sourceKind: ExtractionSourceKind;
  /** Uid of the signed-in user who ran the extraction, when known. */
  createdBy?: string;
  createdAt: number;
  /** Firestore TTL policies can delete expired documents using this field. */
  expiresAt: Date;
}

const memoryCandidates = new Map<string, ExtractionCandidate>();

function rememberInMemory(candidate: ExtractionCandidate): void {
  memoryCandidates.set(candidate.id, candidate);
  if (memoryCandidates.size > MAX_MEMORY_CANDIDATES) {
    const oldest = memoryCandidates.keys().next().value;
    if (oldest) memoryCandidates.delete(oldest);
  }
}

export async function saveExtractionCandidate(
  routine: Routine,
  sourceKind: ExtractionSourceKind,
  createdBy?: string
): Promise<string> {
  const now = Date.now();
  const candidate: ExtractionCandidate = {
    id: randomUUID(),
    routine,
    sourceKind,
    ...(createdBy ? { createdBy } : {}),
    createdAt: now,
    expiresAt: new Date(now + CANDIDATE_TTL_MS)
  };

  rememberInMemory(candidate);

  const db = getFirestore();
  if (db) {
    try {
      // Firestore rejects undefined values, so store a JSON-clean copy of the routine
      await db
        .collection(CANDIDATES_COLLECTION)
        .doc(candidate.id)
        .set({ ...candidate, routine: JSON.parse(JSON.stringify(routine)) });
    } catch (err) {
      logWarning('[CandidateStore] Could not persist candidate; only this instance can confirm it', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return candidate.id;
}

export async function getExtractionCandidate(id: string): Promise<ExtractionCandidate | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  let candidate = memoryCandidates.get(id) ?? null;

  if (!candidate) {
    const db = getFirestore();
    if (db) {
      try {
        const snapshot = await db.collection(CANDIDATES_COLLECTION).doc(id).get();
        if (snapshot.exists) {
          const data = snapshot.data() as Omit<ExtractionCandidate, 'expiresAt'> & {
            expiresAt: Date | { toDate(): Date };
          };
          const expiresAt = data.expiresAt instanceof Date ? data.expiresAt : data.expiresAt.toDate();
          candidate = { ...data, expiresAt };
        }
      } catch (err) {
        logWarning('[CandidateStore] Candidate lookup failed', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
  }

  if (!candidate || candidate.expiresAt.getTime() < Date.now()) return null;
  return candidate;
}
