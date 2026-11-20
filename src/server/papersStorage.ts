/**
 * Google Cloud Firestore Papers Collection & Storage Ledger
 * 
 * Manages the unified "papers" table/collection in Firestore.
 * Stores both curated sample research papers and custom user-uploaded paper extractions.
 * Features automatic seeding on first run and fail-safe in-memory caching.
 */

import { getFirestore } from './guardrailLedger';
import { SAMPLE_PAPERS, PRECALIBRATED_SAMPLE_ROUTINES, type SamplePaper } from '../data/samplePapers';
import type { Routine, StoredPaper } from '../types/routine';
import { getLiveUserStats } from './userStorage';
import { assertDurableWrite } from './persistence';

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
    routineId: paper.routineId,
    isSample: true,
    isGuardrailRejectionTest: paper.isGuardrailRejectionTest,
    popularityScore: paper.popularityScore ?? 0,
    activeTrackersCount: paper.activeTrackersCount ?? 0,
    totalLogsCount: paper.totalLogsCount ?? 0,
    trendingRank: paper.trendingRank,
    routine: paper.routineId ? PRECALIBRATED_SAMPLE_ROUTINES[paper.routineId] : undefined,
    userId: 'trialn1-curated',
    userEmail: '',
    uploadedBy: 'TrialN1',
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

async function enrichPaperWithLiveTelemetry(paper: SamplePaper): Promise<SamplePaper> {
  const targetId = paper.routineId || paper.id;
  const userStats = await getLiveUserStats(targetId);

  return {
    ...paper,
    activeTrackersCount: userStats.activeTrackersCount,
    totalLogsCount: userStats.userLogsCount
  };
}

/**
 * Fetch sample research papers and pre-calibrated routines.
 * Resolves from live Cloud Firestore when available, or gracefully falls back to memory cache.
 */
export async function getSamplePapers(): Promise<{
  trendingPapers: SamplePaper[];
  samplePapers: SamplePaper[];
  routines: Record<string, Routine>;
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
        const routines: Record<string, Routine> = {};

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
            routineId: data.routineId,
            isGuardrailRejectionTest: data.isGuardrailRejectionTest,
            popularityScore: data.popularityScore ?? 0,
            activeTrackersCount: data.activeTrackersCount ?? 0,
            totalLogsCount: data.totalLogsCount ?? 0,
            trendingRank: data.trendingRank,
            // Sample papers are curated by the team; never expose a personal address here
            uploadedBy: 'TrialN1'
          });

          const rId = data.routineId;
          const rObj = data.routine;
          if (rId && rObj) {
            routines[rId] = rObj;
          }
        });

        // Ensure pre-calibrated fallbacks exist if any were omitted
        for (const [key, proto] of Object.entries(PRECALIBRATED_SAMPLE_ROUTINES)) {
          if (!routines[key]) {
            routines[key] = proto;
          }
        }

        const baseList = samplePapers.length > 0 ? samplePapers : SAMPLE_PAPERS;
        const enriched = await Promise.all(baseList.map(enrichPaperWithLiveTelemetry));
        const sorted = enriched.slice().sort(
          (a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0)
        );

        return {
          trendingPapers: sorted,
          samplePapers: sorted,
          routines,
          source: 'firestore-live'
        };
      }
    } catch (err: any) {
      console.warn('[PapersStorage] Firestore read failed, falling back to memory cache:', err?.message || err);
    }
  }

  // Graceful fallback to memory cache
  const samplePapers: SamplePaper[] = [];
  const routines: Record<string, Routine> = { ...PRECALIBRATED_SAMPLE_ROUTINES };

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
        routineId: item.routineId,
        isGuardrailRejectionTest: item.isGuardrailRejectionTest,
        popularityScore: item.popularityScore ?? 0,
        activeTrackersCount: item.activeTrackersCount ?? 0,
        totalLogsCount: item.totalLogsCount ?? 0,
        trendingRank: item.trendingRank,
        uploadedBy: 'TrialN1'
      });
      const rId = item.routineId;
      const rObj = item.routine;
      if (rId && rObj) {
        routines[rId] = rObj;
      }
    }
  }

  const baseList = samplePapers.length > 0 ? samplePapers : SAMPLE_PAPERS;
  const enriched = await Promise.all(baseList.map(enrichPaperWithLiveTelemetry));
  const sorted = enriched.slice().sort(
    (a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0)
  );

  return {
    trendingPapers: sorted,
    samplePapers: sorted,
    routines,
    source: 'memory-cache'
  };
}

export const getTrendingPapers = getSamplePapers;

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

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(PAPERS_COLLECTION)
        .doc(paperWithTimestamps.id)
        .set(JSON.parse(JSON.stringify(paperWithTimestamps)), { merge: true });
      papersMemoryCache.set(paperWithTimestamps.id, paperWithTimestamps);
      return { success: true, source: 'firestore-live' };
    } catch (err: any) {
      assertDurableWrite('Firestore papers', err);
      console.warn('[PapersStorage] Could not write paper to Firestore, retained in memory cache:', err?.message || err);
    }
  } else {
    assertDurableWrite('Firestore papers');
  }

  papersMemoryCache.set(paperWithTimestamps.id, paperWithTimestamps);
  return { success: true, source: 'memory-cache' };
}

/**
 * Fetch papers uploaded by a specific user from the papers table.
 */
export async function getUserPapers(userId: string): Promise<StoredPaper[]> {
  const db = getFirestore();
  if (db) {
    try {
      let snapshot = await db.collection(PAPERS_COLLECTION).where('userId', '==', userId).get();
      if (snapshot.empty) {
        snapshot = await db.collection(PAPERS_COLLECTION).where('userEmail', '==', userId).get();
      }
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
    if (paper.userId === userId || paper.userEmail === userId) {
      result.push(paper);
    }
  }
  return result;
}
