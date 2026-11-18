/**
 * Shared Canonical Routine & Community Registry
 * 
 * Provides global de-duplication across users for research papers.
 * When multiple users add the same PubMed/DOI paper, they attach to a single canonical
 * routine entity, pooling community reviews, drop-off curves, and efficacy telemetry.
 * 
 * Persists to Cloud Firestore when configured, or transparently falls back to
 * an in-memory registry for local development and test environments.
 */

import { getFirestore } from './guardrailLedger';
import { achillesRoutine } from '../data/routines/achilles';
import { hairLossRoutine } from '../data/routines/hairLoss';
import { FALLBACK_CREATINE_SLEEP, FALLBACK_PATELLAR_REHAB } from './fallbackRoutines';
import { calibratedRoutines } from '../data/routines/calibrated';
import type {
  Routine,
  CommunityReview,
  NewCommunityReview,
  CommunityInsights,
  ProposedWidgetSpec,
  RoutineChangelogEntry
} from '../types/routine';
import {
  getCanonicalPaperId,
  normalizeDoi,
  normalizeTitle,
  type PaperIdentifierInput
} from '../utils/paperFingerprint';
import { getLiveUserStats } from './userStorage';

const ROUTINES_COLLECTION = 'routines';
const REVIEWS_SUBCOLLECTION = 'reviews';
const METRICS_SUBCOLLECTION = 'community_metrics';

// Built-in verified seed routines
const BUILTIN_ROUTINES: Record<string, Routine> = {
  achilles: {
    ...achillesRoutine,
    canonicalId: 'achilles',
    isCanonical: true,
    version: '1.0',
    changelog: [
      {
        version: '1.0',
        date: '2026-10-18T00:00:00.000Z',
        summary: 'Initial clinical routine extraction',
        author: 'Viskotu Scientific Board'
      }
    ]
  },
  'hair-loss': {
    ...hairLossRoutine,
    canonicalId: 'hair-loss',
    isCanonical: true,
    version: '1.0',
    changelog: [
      {
        version: '1.0',
        date: '2026-10-18T00:00:00.000Z',
        summary: 'Initial clinical routine extraction',
        author: 'Viskotu Scientific Board'
      }
    ]
  },
  'creatine-sleep': {
    ...FALLBACK_CREATINE_SLEEP,
    canonicalId: 'creatine-sleep',
    isCanonical: true,
    version: '1.0',
    changelog: [
      {
        version: '1.0',
        date: '2026-10-18T00:00:00.000Z',
        summary: 'Initial clinical routine extraction',
        author: 'Viskotu Scientific Board'
      }
    ]
  },
  'patellar-rehab': {
    ...FALLBACK_PATELLAR_REHAB,
    canonicalId: 'patellar-rehab',
    isCanonical: true,
    version: '1.0',
    changelog: [
      {
        version: '1.0',
        date: '2026-10-18T00:00:00.000Z',
        summary: 'Initial clinical routine extraction',
        author: 'Viskotu Scientific Board'
      }
    ]
  },
  ...Object.fromEntries(
    calibratedRoutines.map((routine) => [
      routine.id,
      {
        ...routine,
        canonicalId: routine.id,
        isCanonical: true,
        version: routine.version || '1.0',
        changelog: routine.changelog || [
          {
            version: '1.0',
            date: '2026-10-18T00:00:00.000Z',
            summary: 'Initial clinical routine extraction',
            author: 'Viskotu Scientific Board'
          }
        ]
      }
    ])
  )
};

// In-memory fallback stores
const memoryRoutines = new Map<string, Routine>(Object.entries(BUILTIN_ROUTINES));
const memoryReviews = new Map<string, CommunityReview[]>();

// Seed initial memory reviews
for (const [id, routine] of Object.entries(BUILTIN_ROUTINES)) {
  if (routine.community?.reviews) {
    memoryReviews.set(id, [...routine.community.reviews]);
  }
}

/**
 * Searches for an existing canonical routine matching a research paper.
 * Checks normalized DOI first, then normalized title.
 */
export async function findCanonicalRoutine(
  paper: PaperIdentifierInput,
  fallbackId?: string
): Promise<Routine | null> {
  const canonicalId = getCanonicalPaperId(paper, fallbackId);

  // 1. Check in-memory fast cache / built-in catalog
  if (memoryRoutines.has(canonicalId)) {
    return memoryRoutines.get(canonicalId)!;
  }

  // Check DOI match across memory
  const normDoi = normalizeDoi(paper.doi);
  if (normDoi) {
    for (const r of memoryRoutines.values()) {
      if (normalizeDoi(r.paper?.doi) === normDoi) {
        return r;
      }
    }
  }

const TITLE_ALIASES: Record<string, string[]> = {
  'plantar-fasciitis': ['high load strength training improves outcome in patients with plantar fasciitis'],
  'imst-blood-pressure': ['novel high resistance inspiratory muscle strength training lowers blood pressure'],
  'warm-bath-sleep': [
    'before bedtime passive body heating by warm shower or bath to improve sleep',
    'before bedtime passive water heating by warm shower or bath to improve sleep',
    'warm shower or bath to improve sleep'
  ],
  'cervical-posture': ['effectiveness of an exercise program to improve forward head posture in normal adults'],
  'ashwagandha-stress': [
    'study of safety and efficacy of a high concentration full spectrum extract of ashwagandha root in reducing stress and anxiety'
  ],
  'dual-n-back': ['improving fluid intelligence with training on working memory'],
  'uae-heat-circadian': [
    'efficacy of morning retinal photic stimulation and indoor thermal micro-conditioning',
    'circadian light heat resilient hydration routine'
  ],
  'uae-ramadan-metabolic': [
    'chronobiological synchronization and postprandial glycemic stabilization during intermittent fasting',
    'ramadan circadian metabolic rhythm routine'
  ],
  'uae-midwakh-tapering': [
    'clinical efficacy of behavioral substitution and urge surfing for high nicotine midwakh pipe cessation',
    'midwakh dokha behavioral harm reduction tapering routine'
  ]
};

  // Check Title and Filename match across in-memory catalog
  if (paper.title) {
    const searchSlug = normalizeTitle(paper.title);
    const cleanSearch = paper.title.toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
    if (searchSlug && searchSlug !== 'untitled-paper') {
      for (const r of memoryRoutines.values()) {
        const rSlug = normalizeTitle(r.paper?.title || r.title);
        if (rSlug === searchSlug || searchSlug.includes(rSlug) || rSlug.includes(searchSlug)) {
          return r;
        }
        const aliases = TITLE_ALIASES[r.id] || [];
        if (aliases.some((alias) => cleanSearch.includes(alias) || alias.includes(cleanSearch))) {
          return r;
        }
        if (r.paper?.fileName) {
          const fn = r.paper.fileName.toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
          if (fn && (cleanSearch.includes(fn) || fn.includes(cleanSearch))) {
            return r;
          }
        }
      }
    }
  }

  // 2. Check Firestore live routines collection
  const db = getFirestore();
  if (db) {
    try {
      const docRef = db.collection(ROUTINES_COLLECTION).doc(canonicalId);
      const snapshot = await docRef.get();

      if (snapshot.exists) {
        const data = snapshot.data() as Routine;
        memoryRoutines.set(canonicalId, data);
        return data;
      }

      // Query by DOI in Firestore
      if (normDoi) {
        const querySnap = await db
          .collection(ROUTINES_COLLECTION)
          .where('paper.doi', '==', normDoi)
          .limit(1)
          .get();
        if (!querySnap.empty) {
          const matched = querySnap.docs[0].data() as Routine;
          memoryRoutines.set(matched.id, matched);
          return matched;
        }
      }

      // Query by Title in Firestore
      if (paper.title && paper.title !== 'Untitled Paper') {
        const titleQuery = await db
          .collection(ROUTINES_COLLECTION)
          .where('title', '==', paper.title)
          .limit(1)
          .get();
        if (!titleQuery.empty) {
          const matched = titleQuery.docs[0].data() as Routine;
          memoryRoutines.set(matched.id, matched);
          return matched;
        }
      }
    } catch (err: any) {
      console.warn('[RoutineRegistry] Firestore lookup failed, falling back to local memory:', err?.message || err);
    }
  }

  return null;
}

/** Gives a routine its canonical paper id and initial version history without registering it. */
export function toCanonicalRoutine(routine: Routine): Routine {
  const canonicalId = getCanonicalPaperId(routine.paper, routine.id);
  const initialVersion = routine.version || '1.0';
  const initialChangelog: RoutineChangelogEntry[] =
    routine.changelog && routine.changelog.length > 0
      ? routine.changelog
      : [
          {
            version: initialVersion,
            date: new Date().toISOString(),
            summary: 'Initial clinical routine extraction',
            author: 'Viskotu Extraction Engine'
          }
        ];

  return {
    ...routine,
    id: canonicalId,
    canonicalId,
    version: initialVersion,
    changelog: initialChangelog,
    // Only a registered routine is canonical; a fresh extraction is still a candidate for review
    isCanonical: false
  };
}

/**
 * Saves or de-duplicates a routine in the canonical Firestore registry.
 * If the routine already exists, returns the existing canonical entity without duplicating.
 * Only call this for routines a user has confirmed: later extractions of the same paper reuse this entry.
 */
export async function saveCanonicalRoutine(
  routine: Routine
): Promise<{ routine: Routine; isNew: boolean }> {
  // Check if already registered
  const existing = await findCanonicalRoutine(routine.paper, routine.id);
  if (existing) {
    return { routine: existing, isNew: false };
  }

  const canonicalRoutine: Routine = { ...toCanonicalRoutine(routine), isCanonical: true };
  const canonicalId = canonicalRoutine.id;

  // Update in-memory registry
  memoryRoutines.set(canonicalId, canonicalRoutine);

  // Initialize reviews cache
  if (routine.community?.reviews) {
    memoryReviews.set(canonicalId, [...routine.community.reviews]);
  }

  // Persist to Cloud Firestore if connected
  const db = getFirestore();
  if (db) {
    try {
      const docRef = db.collection(ROUTINES_COLLECTION).doc(canonicalId);
      await docRef.set({
        ...canonicalRoutine,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Seed initial baseline reviews as subcollection documents
      if (routine.community?.reviews && routine.community.reviews.length > 0) {
        const batch = db.batch();
        for (const review of routine.community.reviews) {
          const revRef = docRef.collection(REVIEWS_SUBCOLLECTION).doc(review.id);
          batch.set(revRef, {
            ...review,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        await batch.commit();
      }
    } catch (err: any) {
      console.warn('[RoutineRegistry] Could not persist canonical routine to Firestore:', err?.message || err);
    }
  }

  return { routine: canonicalRoutine, isNew: true };
}

/**
 * Retrieves community reviews for a canonical routine.
 * Merges live Firestore community reviews with seeded baseline reviews.
 */
export async function getCommunityReviews(routineId: string): Promise<CommunityReview[]> {
  const canonicalId = getCanonicalPaperId({ id: routineId }, routineId);
  const reviews: CommunityReview[] = [];

  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db
        .collection(ROUTINES_COLLECTION)
        .doc(canonicalId)
        .collection(REVIEWS_SUBCOLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
          const data = doc.data();
          reviews.push({
            id: doc.id,
            handle: data.handle || 'Anonymous participant',
            day: data.day || 1,
            outcome: data.outcome || 'improved',
            text: data.text || '',
            adherence: data.adherence ?? 85,
            createdAt: data.createdAt,
            userId: data.userId,
            lifestyleCohort: data.lifestyleCohort,
            tags: data.tags
          });
        }
        return reviews;
      }
    } catch (err: any) {
      console.warn('[RoutineRegistry] Error reading community reviews from Firestore:', err?.message || err);
    }
  }

  // Fallback to in-memory store
  const local = memoryReviews.get(canonicalId) || memoryReviews.get(routineId);
  if (local && local.length > 0) {
    return [...local];
  }

  // Check if routine definition has baseline reviews
  const r = memoryRoutines.get(canonicalId) || memoryRoutines.get(routineId);
  return r?.community?.reviews ? [...r.community.reviews] : [];
}

/**
 * Adds a new community review to a canonical routine.
 * Stores in Firestore subcollection `routines/{canonicalId}/reviews` and updates memory cache.
 */
export async function addCommunityReview(
  routineId: string,
  review: NewCommunityReview,
  userId?: string
): Promise<CommunityReview> {
  const canonicalId = getCanonicalPaperId({ id: routineId }, routineId);
  const newReview: CommunityReview = {
    ...review,
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    handle: review.handle || 'Anonymous participant',
    userId: userId || review.userId,
    createdAt: new Date().toISOString()
  };

  // Update in-memory cache
  const existing = memoryReviews.get(canonicalId) || memoryReviews.get(routineId) || [];
  const updated = [newReview, ...existing];
  memoryReviews.set(canonicalId, updated);
  if (routineId !== canonicalId) {
    memoryReviews.set(routineId, updated);
  }

  // Persist to Cloud Firestore
  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(ROUTINES_COLLECTION)
        .doc(canonicalId)
        .collection(REVIEWS_SUBCOLLECTION)
        .doc(newReview.id)
        .set(newReview);

      // Invalidate / update metrics cache
      await db
        .collection(ROUTINES_COLLECTION)
        .doc(canonicalId)
        .collection(METRICS_SUBCOLLECTION)
        .doc('aggregate')
        .delete()
        .catch(() => {});
    } catch (err: any) {
      console.warn('[RoutineRegistry] Failed to persist review to Firestore:', err?.message || err);
    }
  }

  return newReview;
}

/**
 * Retrieves aggregate community metrics for a canonical routine.
 */
export async function getCommunityMetrics(
  routineId: string
): Promise<CommunityInsights | null> {
  const canonicalId = getCanonicalPaperId({ id: routineId }, routineId);
  const routine = memoryRoutines.get(canonicalId) || memoryRoutines.get(routineId);
  if (!routine) return null;

  const baseline = routine.community;

  // Compute live reviews and user counts
  const allReviews = await getCommunityReviews(routineId);
  const improvedCount = allReviews.filter((r) => r.outcome === 'improved').length;
  const liveEfficacy =
    allReviews.length > 0 ? Math.round((improvedCount / allReviews.length) * 100) : baseline.realWorldEfficacy;

  // Real-time telemetry from Firestore user storage
  const userStats = await getLiveUserStats(routineId);
  const canonicalStats =
    canonicalId !== routineId ? await getLiveUserStats(canonicalId) : { activeTrackersCount: 0, userLogsCount: 0 };

  const totalLiveTrackers = userStats.activeTrackersCount + canonicalStats.activeTrackersCount;
  const totalUserCount = Math.max(baseline.userCount, totalLiveTrackers);

  // Read cached metrics from Firestore if available
  const db = getFirestore();
  if (db) {
    try {
      const metricsDoc = await db
        .collection(ROUTINES_COLLECTION)
        .doc(canonicalId)
        .collection(METRICS_SUBCOLLECTION)
        .doc('aggregate')
        .get();

      if (metricsDoc.exists) {
        return {
          ...baseline,
          ...(metricsDoc.data() as Partial<CommunityInsights>),
          reviews: allReviews,
          userCount: totalUserCount
        };
      }
    } catch (err: any) {
      console.warn('[RoutineRegistry] Could not fetch community metrics from Firestore:', err?.message || err);
    }
  }

  return {
    ...baseline,
    realWorldEfficacy: liveEfficacy,
    userCount: totalUserCount,
    reviews: allReviews
  };
}

/**
 * Updates a canonical routine's dataCollectionSpec when an admin confirms an AI-proposed widget.
 */
export async function injectApprovedWidgetIntoCanonicalRoutine(
  approvedProposal: ProposedWidgetSpec
): Promise<Routine | null> {
  const targetId = approvedProposal.routineId;
  if (!targetId) return null;

  const canonicalId = getCanonicalPaperId(
    { id: targetId },
    targetId
  );
  const existing =
    memoryRoutines.get(canonicalId) ||
    memoryRoutines.get(targetId) ||
    (await findCanonicalRoutine({ id: targetId }, targetId));

  if (!existing || !existing.dataCollectionSpec) {
    return null;
  }

  const updatedSpec = existing.dataCollectionSpec.map((field) => {
    if (
      field.id === approvedProposal.fieldId ||
      field.proposedWidget?.id === approvedProposal.id
    ) {
      return {
        ...field,
        proposedWidget: approvedProposal
      };
    }
    return field;
  });

  const updatedRoutine: Routine = {
    ...existing,
    dataCollectionSpec: updatedSpec
  };

  memoryRoutines.set(canonicalId, updatedRoutine);
  if (targetId !== canonicalId) {
    memoryRoutines.set(targetId, updatedRoutine);
  }

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(ROUTINES_COLLECTION)
        .doc(canonicalId)
        .set({ dataCollectionSpec: updatedSpec }, { merge: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[RoutineRegistry] Failed to persist approved widget to canonical routine:', message);
    }
  }

  return updatedRoutine;
}

/**
 * Updates a canonical routine with user or clinical improvements, bumping its version.
 */
export async function updateCanonicalRoutineVersion(
  routineId: string,
  updates: Partial<Routine>,
  summary: string,
  author = 'Community Contributor',
  addedFields?: string[],
  updatedFields?: string[]
): Promise<Routine | null> {
  const canonicalId = getCanonicalPaperId({ id: routineId }, routineId);
  const existing =
    memoryRoutines.get(canonicalId) ||
    memoryRoutines.get(routineId) ||
    (await findCanonicalRoutine({ id: routineId }, routineId));

  if (!existing) return null;

  // Calculate next version: e.g. 1.0 -> 1.1, 1.1 -> 1.2
  const currentVersion = existing.version || '1.0';
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0] || '1', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const nextVersion = `${major}.${minor + 1}`;

  const newEntry: RoutineChangelogEntry = {
    version: nextVersion,
    date: new Date().toISOString(),
    summary,
    author,
    addedFields,
    updatedFields
  };

  const updatedChangelog = [newEntry, ...(existing.changelog || [])];

  const updatedRoutine: Routine = {
    ...existing,
    ...updates,
    id: existing.id,
    canonicalId: existing.canonicalId || canonicalId,
    version: nextVersion,
    changelog: updatedChangelog,
    isCanonical: true
  };

  memoryRoutines.set(canonicalId, updatedRoutine);
  if (routineId !== canonicalId) {
    memoryRoutines.set(routineId, updatedRoutine);
  }

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(ROUTINES_COLLECTION)
        .doc(canonicalId)
        .set(
          {
            ...updates,
            version: nextVersion,
            changelog: updatedChangelog,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
    } catch (err: unknown) {
      console.warn('[RoutineRegistry] Failed to persist routine version bump:', err);
    }
  }

  return updatedRoutine;
}

