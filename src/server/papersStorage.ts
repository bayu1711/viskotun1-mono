/**
 * Google Cloud Firestore Papers Collection & Storage Ledger
 * 
 * Manages the unified "papers" table/collection in Firestore.
 * Stores both curated sample research papers and custom user-uploaded paper extractions.
 * Features automatic seeding on first run and fail-safe in-memory caching.
 */

import { getFirestore } from './guardrailLedger';
import { SAMPLE_PAPERS, PRECALIBRATED_SAMPLE_PROTOCOLS, type SamplePaper } from '../data/samplePapers';
import type { Protocol, StoredPaper } from '../types/protocol';

export const PAPERS_COLLECTION = 'papers';

// In-memory hot storage cache initialized with baseline sample papers
const papersMemoryCache = new Map<string, StoredPaper>();

function createInitialSamplePapers(): StoredPaper[] {
  return SAMPLE_PAPERS.map((paper) => ({
    id: paper.id,
    title: paper.title,
    shortTitle: paper.shortTitle,
    domain: paper.domain,
    category: paper.category,
    authors: paper.authors,
    journal: paper.journal,
    year: paper.year,
    doi: paper.doi,
    pmcId: paper.pmcId,
    openAccessUrl: paper.openAccessUrl,
    pdfUrl: paper.pdfUrl,
    summary: paper.summary,
    featuresTested: paper.featuresTested,
    protocolId: paper.protocolId,
    isSample: true,
    isGuardrailRejectionTest: paper.isGuardrailRejectionTest,
    protocol: paper.protocolId ? PRECALIBRATED_SAMPLE_PROTOCOLS[paper.protocolId] : undefined,
    userId: 'system',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }));
}

// Seed the in-memory cache immediately
for (const paper of createInitialSamplePapers()) {
  papersMemoryCache.set(paper.id, paper);
}

let hasAttemptedFirestoreSeed = false;

/**
 * Seed sample research papers into Firestore if the collection is empty.
 */
export async function seedSamplePapersIfEmpty(): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const existing = await db.collection(PAPERS_COLLECTION).where('isSample', '==', true).limit(1).get();
    if (!existing.empty) {
      return true;
    }

    const batch = db.batch();
    const samples = createInitialSamplePapers();
    for (const paper of samples) {
      const docRef = db.collection(PAPERS_COLLECTION).doc(paper.id);
      batch.set(docRef, paper, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (err: any) {
    console.warn('[PapersStorage] Could not seed sample papers to Firestore:', err?.message || err);
    return false;
  }
}

/**
 * Fetch sample research papers and pre-calibrated protocols.
 * Resolves from live Cloud Firestore when available, or gracefully falls back to memory cache.
 */
export async function getSamplePapers(): Promise<{
  samplePapers: SamplePaper[];
  protocols: Record<string, Protocol>;
  source: 'firestore-live' | 'memory-cache';
}> {
  const db = getFirestore();

  if (db) {
    try {
      if (!hasAttemptedFirestoreSeed) {
        hasAttemptedFirestoreSeed = true;
        await seedSamplePapersIfEmpty();
      }

      const snapshot = await db.collection(PAPERS_COLLECTION).where('isSample', '==', true).get();
      if (!snapshot.empty) {
        const samplePapers: SamplePaper[] = [];
        const protocols: Record<string, Protocol> = {};

        snapshot.forEach((doc) => {
          const data = doc.data() as StoredPaper;
          papersMemoryCache.set(data.id, data);

          samplePapers.push({
            id: data.id,
            title: data.title,
            shortTitle: data.shortTitle,
            domain: data.domain,
            category: data.category as SamplePaper['category'],
            authors: data.authors,
            journal: data.journal,
            year: data.year,
            doi: data.doi,
            pmcId: data.pmcId,
            openAccessUrl: data.openAccessUrl,
            pdfUrl: data.pdfUrl,
            summary: data.summary,
            featuresTested: data.featuresTested || [],
            protocolId: data.protocolId,
            isGuardrailRejectionTest: data.isGuardrailRejectionTest
          });

          if (data.protocolId && data.protocol) {
            protocols[data.protocolId] = data.protocol;
          }
        });

        // Ensure pre-calibrated fallbacks exist if any were omitted
        for (const [key, proto] of Object.entries(PRECALIBRATED_SAMPLE_PROTOCOLS)) {
          if (!protocols[key]) {
            protocols[key] = proto;
          }
        }

        return {
          samplePapers: samplePapers.length > 0 ? samplePapers : SAMPLE_PAPERS,
          protocols,
          source: 'firestore-live'
        };
      }
    } catch (err: any) {
      console.warn('[PapersStorage] Firestore read failed, falling back to memory cache:', err?.message || err);
    }
  }

  // Graceful fallback to memory cache
  const samplePapers: SamplePaper[] = [];
  const protocols: Record<string, Protocol> = { ...PRECALIBRATED_SAMPLE_PROTOCOLS };

  for (const item of papersMemoryCache.values()) {
    if (item.isSample) {
      samplePapers.push({
        id: item.id,
        title: item.title,
        shortTitle: item.shortTitle,
        domain: item.domain,
        category: item.category as SamplePaper['category'],
        authors: item.authors,
        journal: item.journal,
        year: item.year,
        doi: item.doi,
        pmcId: item.pmcId,
        openAccessUrl: item.openAccessUrl,
        pdfUrl: item.pdfUrl,
        summary: item.summary,
        featuresTested: item.featuresTested,
        protocolId: item.protocolId,
        isGuardrailRejectionTest: item.isGuardrailRejectionTest
      });
      if (item.protocolId && item.protocol) {
        protocols[item.protocolId] = item.protocol;
      }
    }
  }

  return {
    samplePapers: samplePapers.length > 0 ? samplePapers : SAMPLE_PAPERS,
    protocols,
    source: 'memory-cache'
  };
}

/**
 * Persist a paper document (either user-uploaded or sample) into the unified Firestore papers table.
 */
export async function savePaper(paper: StoredPaper): Promise<{
  success: boolean;
  source: 'firestore-live' | 'memory-cache';
}> {
  const paperWithTimestamps: StoredPaper = {
    ...paper,
    createdAt: paper.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  // Always update in-memory cache
  papersMemoryCache.set(paperWithTimestamps.id, paperWithTimestamps);

  const db = getFirestore();
  if (db) {
    try {
      await db.collection(PAPERS_COLLECTION).doc(paperWithTimestamps.id).set(paperWithTimestamps, { merge: true });
      return { success: true, source: 'firestore-live' };
    } catch (err: any) {
      console.warn('[PapersStorage] Could not write paper to Firestore, retained in memory cache:', err?.message || err);
      return { success: true, source: 'memory-cache' };
    }
  }

  return { success: true, source: 'memory-cache' };
}

/**
 * Fetch papers uploaded by a specific user from the papers table.
 */
export async function getUserPapers(userId: string): Promise<StoredPaper[]> {
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection(PAPERS_COLLECTION).where('userId', '==', userId).get();
      if (!snapshot.empty) {
        const result: StoredPaper[] = [];
        snapshot.forEach((doc) => {
          result.push(doc.data() as StoredPaper);
        });
        return result;
      }
    } catch (err: any) {
      console.warn('[PapersStorage] Could not fetch user papers from Firestore:', err?.message || err);
    }
  }

  const result: StoredPaper[] = [];
  for (const paper of papersMemoryCache.values()) {
    if (paper.userId === userId) {
      result.push(paper);
    }
  }
  return result;
}
