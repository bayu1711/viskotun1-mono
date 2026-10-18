/**
 * Shared Canonical Protocol & Community Registry
 *
 * Implements deterministic deduplication and canonical linking for research papers in Firestore.
 * When multiple users study or practice the same research paper, they link to the single canonical
 * protocol entity, pooling community reviews, drop-off curves, and efficacy telemetry.
 *
 * Includes hot in-memory fallback cache for offline development or unconfigured credentials.
 */

import { getFirestore } from './guardrailLedger';
import { achillesProtocol } from '../data/protocols/achilles';
import { hairLossProtocol } from '../data/protocols/hairLoss';
import { calibratedRoutines } from '../data/routines/calibrated';
import {
  FALLBACK_CREATINE_SLEEP,
  FALLBACK_PATELLAR_REHAB
} from './fallbackRoutines';
import type {
  Routine,
  Protocol,
  CommunityReview,
  NewCommunityReview,
  CommunityInsights,
  PaperMeta
} from '../types/routine';
import {
  getCanonicalPaperId,
  normalizeDoi,
  normalizeTitle,
  type PaperIdentifierInput
} from '../utils/paperFingerprint';
import { getLiveUserStats } from './userStorage';

const PROTOCOLS_COLLECTION = 'protocols';
const REVIEWS_SUBCOLLECTION = 'reviews';
const METRICS_SUBCOLLECTION = 'community_metrics';

// Built-in verified seed protocols
const BUILTIN_PROTOCOLS: Record<string, Protocol> = {
  achilles: { ...achillesProtocol, canonicalId: 'achilles', isCanonical: true },
  'hair-loss': { ...hairLossProtocol, canonicalId: 'hair-loss', isCanonical: true },
  'creatine-sleep': { ...FALLBACK_CREATINE_SLEEP, canonicalId: 'creatine-sleep', isCanonical: true },
  'patellar-rehab': { ...FALLBACK_PATELLAR_REHAB, canonicalId: 'patellar-rehab', isCanonical: true },
  ...Object.fromEntries(
    calibratedRoutines.map((routine) => [routine.id, { ...routine, canonicalId: routine.id, isCanonical: true }])
  )
};

// In-memory fallback stores
const memoryProtocols = new Map<string, Protocol>(Object.entries(BUILTIN_PROTOCOLS));
const memoryReviews = new Map<string, CommunityReview[]>();

// Seed initial memory reviews
for (const [id, protocol] of Object.entries(BUILTIN_PROTOCOLS)) {
  if (protocol.community?.reviews) {
    memoryReviews.set(id, [...protocol.community.reviews]);
  }
}

/**
 * Searches for an existing canonical protocol matching a research paper.
 * Checks normalized DOI first, then normalized title.
 */
export async function findCanonicalProtocol(
  paper: PaperIdentifierInput,
  fallbackId?: string
): Promise<Protocol | null> {
  const canonicalId = getCanonicalPaperId(paper, fallbackId);

  // 1. Check in-memory fast cache / built-in catalog
  if (memoryProtocols.has(canonicalId)) {
    return memoryProtocols.get(canonicalId)!;
  }

  // Check DOI match across memory
  const normDoi = normalizeDoi(paper.doi);
  if (normDoi) {
    for (const p of memoryProtocols.values()) {
      if (normalizeDoi(p.paper?.doi) === normDoi) {
        return p;
      }
    }
  }

  // 2. Check Firestore live protocols collection
  const db = getFirestore();
  if (db) {
    try {
      // Direct canonical document ID lookup
      const docRef = db.collection(PROTOCOLS_COLLECTION).doc(canonicalId);
      const snapshot = await docRef.get();
      if (snapshot.exists) {
        const data = snapshot.data() as Protocol;
        memoryProtocols.set(canonicalId, data);
        return data;
      }

      // Query by DOI if document ID differed
      if (normDoi) {
        const querySnap = await db
          .collection(PROTOCOLS_COLLECTION)
          .where('paper.doi', '==', paper.doi)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          const matched = querySnap.docs[0].data() as Protocol;
          memoryProtocols.set(matched.id, matched);
          return matched;
        }
      }

      // Query by normalized title
      const titleSlug = normalizeTitle(paper.title);
      if (titleSlug && titleSlug !== 'untitled-paper') {
        const titleQuery = await db
          .collection(PROTOCOLS_COLLECTION)
          .where('paper.title', '==', paper.title)
          .limit(1)
          .get();

        if (!titleQuery.empty) {
          const matched = titleQuery.docs[0].data() as Protocol;
          memoryProtocols.set(matched.id, matched);
          return matched;
        }
      }
    } catch (err: any) {
      console.warn('[ProtocolRegistry] Firestore lookup failed, falling back to local memory:', err?.message || err);
    }
  }

  return null;
}

/**
 * Saves or de-duplicates a protocol in the canonical Firestore registry.
 * If the protocol already exists, returns the existing canonical entity without duplicating.
 */
export async function saveCanonicalProtocol(
  protocol: Protocol
): Promise<{ protocol: Protocol; isNew: boolean }> {
  const canonicalId = getCanonicalPaperId(protocol.paper, protocol.id);

  // Check if already registered
  const existing = await findCanonicalProtocol(protocol.paper, protocol.id);
  if (existing) {
    return { protocol: existing, isNew: false };
  }

  const canonicalProtocol: Protocol = {
    ...protocol,
    id: canonicalId,
    canonicalId,
    isCanonical: true
  };

  // Update in-memory registry
  memoryProtocols.set(canonicalId, canonicalProtocol);

  // Initialize reviews cache
  if (protocol.community?.reviews) {
    memoryReviews.set(canonicalId, [...protocol.community.reviews]);
  }

  // Persist to Cloud Firestore if connected
  const db = getFirestore();
  if (db) {
    try {
      const docRef = db.collection(PROTOCOLS_COLLECTION).doc(canonicalId);
      await docRef.set({
        ...canonicalProtocol,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Seed initial baseline reviews as subcollection documents
      if (protocol.community?.reviews && protocol.community.reviews.length > 0) {
        const batch = db.batch();
        for (const review of protocol.community.reviews) {
          const revRef = docRef.collection(REVIEWS_SUBCOLLECTION).doc(review.id);
          batch.set(revRef, {
            ...review,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        await batch.commit();
      }
    } catch (err: any) {
      console.warn('[ProtocolRegistry] Could not persist canonical protocol to Firestore:', err?.message || err);
    }
  }

  return { protocol: canonicalProtocol, isNew: true };
}

/**
 * Retrieves community reviews for a canonical protocol.
 * Merges live Firestore community reviews with seeded baseline reviews.
 */
export async function getCommunityReviews(protocolId: string): Promise<CommunityReview[]> {
  const canonicalId = getCanonicalPaperId({ id: protocolId }, protocolId);
  const reviews: CommunityReview[] = [];

  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db
        .collection(PROTOCOLS_COLLECTION)
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
            adherence: data.adherence || 100,
            createdAt: data.createdAt,
            userId: data.userId
          });
        }
        return reviews;
      }
    } catch (err: any) {
      console.warn('[ProtocolRegistry] Error reading community reviews from Firestore:', err?.message || err);
    }
  }

  // Memory fallback
  const local = memoryReviews.get(canonicalId) || memoryReviews.get(protocolId);
  if (local && local.length > 0) {
    return local;
  }

  // Check if protocol definition has baseline reviews
  const proto = memoryProtocols.get(canonicalId) || memoryProtocols.get(protocolId);
  return proto?.community?.reviews || [];
}

/**
 * Adds a new community review to a canonical protocol.
 * Stores in Firestore subcollection `protocols/{canonicalId}/reviews` and updates memory cache.
 */
export async function addCommunityReview(
  protocolId: string,
  newReview: NewCommunityReview,
  userId?: string
): Promise<CommunityReview> {
  const canonicalId = getCanonicalPaperId({ id: protocolId }, protocolId);
  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();

  const review: CommunityReview = {
    id: reviewId,
    handle: newReview.handle?.trim() || 'Anonymous participant',
    day: Math.max(1, Math.round(newReview.day)),
    outcome: newReview.outcome,
    text: newReview.text.trim(),
    adherence: Math.max(0, Math.min(100, Math.round(newReview.adherence))),
    createdAt: nowIso,
    userId
  };

  // 1. Update in-memory cache
  const currentReviews = memoryReviews.get(canonicalId) || [];
  memoryReviews.set(canonicalId, [review, ...currentReviews]);

  // 2. Persist to Cloud Firestore
  const db = getFirestore();
  if (db) {
    try {
      const docRef = db
        .collection(PROTOCOLS_COLLECTION)
        .doc(canonicalId)
        .collection(REVIEWS_SUBCOLLECTION)
        .doc(reviewId);

      await docRef.set(review);

      // Increment or update community aggregate telemetry
      const metricsRef = db
        .collection(PROTOCOLS_COLLECTION)
        .doc(canonicalId)
        .collection(METRICS_SUBCOLLECTION)
        .doc('aggregate');

      const allReviews = memoryReviews.get(canonicalId) || [review];
      const improvedCount = allReviews.filter((r) => r.outcome === 'improved').length;
      const calculatedEfficacy = Math.round((improvedCount / allReviews.length) * 100);

      await metricsRef.set(
        {
          totalReviews: allReviews.length,
          realWorldEfficacy: calculatedEfficacy,
          lastReviewAt: nowIso
        },
        { merge: true }
      );
    } catch (err: any) {
      console.warn('[ProtocolRegistry] Failed to persist review to Firestore:', err?.message || err);
    }
  }

  return review;
}

/**
 * Retrieves aggregate community metrics for a canonical protocol.
 */
export async function getCommunityMetrics(
  protocolId: string
): Promise<CommunityInsights | null> {
  const canonicalId = getCanonicalPaperId({ id: protocolId }, protocolId);
  const proto = memoryProtocols.get(canonicalId) || memoryProtocols.get(protocolId);

  const baselineInsights = proto?.community;
  if (!baselineInsights) return null;

  const allReviews = await getCommunityReviews(protocolId);
  const improvedCount = allReviews.filter((r) => r.outcome === 'improved').length;
  const calculatedEfficacy =
    allReviews.length > 0 ? Math.round((improvedCount / allReviews.length) * 100) : 0;

  const userStats = await getLiveUserStats(protocolId);
  const userStatsCanonical =
    canonicalId !== protocolId ? await getLiveUserStats(canonicalId) : { activeTrackersCount: 0, userLogsCount: 0 };
  const realActiveTrackers = Math.max(
    userStats.activeTrackersCount,
    userStatsCanonical.activeTrackersCount
  );

  const totalParticipants = Math.max(realActiveTrackers, allReviews.length);

  const db = getFirestore();
  if (db) {
    try {
      const metricsDoc = await db
        .collection(PROTOCOLS_COLLECTION)
        .doc(canonicalId)
        .collection(METRICS_SUBCOLLECTION)
        .doc('aggregate')
        .get();

      if (metricsDoc.exists) {
        const data = metricsDoc.data();
        return {
          ...baselineInsights,
          realWorldEfficacy: data?.realWorldEfficacy ?? calculatedEfficacy,
          userCount: Math.max(totalParticipants, data?.totalReviews || 0)
        };
      }
    } catch (err: any) {
      console.warn('[ProtocolRegistry] Could not fetch community metrics from Firestore:', err?.message || err);
    }
  }

  return {
    ...baselineInsights,
    realWorldEfficacy: calculatedEfficacy,
    userCount: totalParticipants
  };
}

export const findCanonicalRoutine = findCanonicalProtocol;
export const saveCanonicalRoutine = saveCanonicalProtocol;
