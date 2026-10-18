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
  PaperMeta,
  ProposedWidgetSpec,
  ProtocolChangelogEntry
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
  achilles: {
    ...achillesProtocol,
    canonicalId: 'achilles',
    isCanonical: true,
    version: '1.0',
    changelog: [
      {
        version: '1.0',
        date: '2026-10-18T00:00:00.000Z',
        summary: 'Initial clinical protocol extraction',
        author: 'Viskotu Scientific Board'
      }
    ]
  },
  'hair-loss': {
    ...hairLossProtocol,
    canonicalId: 'hair-loss',
    isCanonical: true,
    version: '1.0',
    changelog: [
      {
        version: '1.0',
        date: '2026-10-18T00:00:00.000Z',
        summary: 'Initial clinical protocol extraction',
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
        summary: 'Initial clinical protocol extraction',
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
        summary: 'Initial clinical protocol extraction',
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
            summary: 'Initial clinical protocol extraction',
            author: 'Viskotu Scientific Board'
          }
        ]
      }
    ])
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
  'dual-n-back': ['improving fluid intelligence with training on working memory']
};

  // Check Title and Filename match across in-memory catalog
  if (paper.title) {
    const searchSlug = normalizeTitle(paper.title);
    const cleanSearch = paper.title.toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
    if (searchSlug && searchSlug !== 'untitled-paper') {
      for (const p of memoryProtocols.values()) {
        const pSlug = normalizeTitle(p.paper?.title || p.title);
        if (pSlug === searchSlug || searchSlug.includes(pSlug) || pSlug.includes(searchSlug)) {
          return p;
        }
        const aliases = TITLE_ALIASES[p.id] || [];
        if (aliases.some((alias) => cleanSearch.includes(alias) || alias.includes(cleanSearch))) {
          return p;
        }
        if (p.paper?.fileName) {
          const fn = p.paper.fileName.toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
          if (fn && (cleanSearch.includes(fn) || fn.includes(cleanSearch))) {
            return p;
          }
        }
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

/** Gives a protocol its canonical paper id and initial version history without registering it. */
export function toCanonicalProtocol(protocol: Protocol): Protocol {
  const canonicalId = getCanonicalPaperId(protocol.paper, protocol.id);
  const initialVersion = protocol.version || '1.0';
  const initialChangelog: ProtocolChangelogEntry[] =
    protocol.changelog && protocol.changelog.length > 0
      ? protocol.changelog
      : [
          {
            version: initialVersion,
            date: new Date().toISOString(),
            summary: 'Initial clinical protocol extraction',
            author: 'Viskotu Extraction Engine'
          }
        ];

  return {
    ...protocol,
    id: canonicalId,
    canonicalId,
    version: initialVersion,
    changelog: initialChangelog,
    // Only a registered routine is canonical; a fresh extraction is still a candidate for review
    isCanonical: false
  };
}

/**
 * Saves or de-duplicates a protocol in the canonical Firestore registry.
 * If the protocol already exists, returns the existing canonical entity without duplicating.
 * Only call this for routines a user has confirmed: later extractions of the same paper reuse this entry.
 */
export async function saveCanonicalProtocol(
  protocol: Protocol
): Promise<{ protocol: Protocol; isNew: boolean }> {
  // Check if already registered
  const existing = await findCanonicalProtocol(protocol.paper, protocol.id);
  if (existing) {
    return { protocol: existing, isNew: false };
  }

  const canonicalProtocol: Protocol = { ...toCanonicalProtocol(protocol), isCanonical: true };
  const canonicalId = canonicalProtocol.id;

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

/**
 * Updates a canonical protocol's dataCollectionSpec when an admin confirms an AI-proposed widget.
 */
export async function injectApprovedWidgetIntoCanonicalProtocol(
  approvedProposal: ProposedWidgetSpec
): Promise<Protocol | null> {
  if (!approvedProposal.protocolId) return null;

  const canonicalId = getCanonicalPaperId(
    { id: approvedProposal.protocolId },
    approvedProposal.protocolId
  );
  const existing =
    memoryProtocols.get(canonicalId) ||
    memoryProtocols.get(approvedProposal.protocolId) ||
    (await findCanonicalProtocol({ id: approvedProposal.protocolId }, approvedProposal.protocolId));

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

  const updatedProtocol: Protocol = {
    ...existing,
    dataCollectionSpec: updatedSpec
  };

  memoryProtocols.set(canonicalId, updatedProtocol);
  if (approvedProposal.protocolId !== canonicalId) {
    memoryProtocols.set(approvedProposal.protocolId, updatedProtocol);
  }

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(PROTOCOLS_COLLECTION)
        .doc(canonicalId)
        .set({ dataCollectionSpec: updatedSpec }, { merge: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('[ProtocolRegistry] Failed to persist approved widget to canonical protocol:', message);
    }
  }

  return updatedProtocol;
}

/**
 * Updates a canonical protocol with user or clinical improvements, bumping its version.
 */
export async function updateCanonicalProtocolVersion(
  protocolId: string,
  updates: Partial<Protocol>,
  summary: string,
  author = 'Community Contributor',
  addedFields?: string[],
  updatedFields?: string[]
): Promise<Protocol | null> {
  const canonicalId = getCanonicalPaperId({ id: protocolId }, protocolId);
  const existing =
    memoryProtocols.get(canonicalId) ||
    memoryProtocols.get(protocolId) ||
    (await findCanonicalProtocol({ id: protocolId }, protocolId));

  if (!existing) return null;

  // Calculate next version: e.g. 1.0 -> 1.1, 1.1 -> 1.2
  const currentVersion = existing.version || '1.0';
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0] || '1', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const nextVersion = `${major}.${minor + 1}`;

  const newEntry: ProtocolChangelogEntry = {
    version: nextVersion,
    date: new Date().toISOString(),
    summary,
    author,
    addedFields,
    updatedFields
  };

  const updatedChangelog = [newEntry, ...(existing.changelog || [])];

  const updatedProtocol: Protocol = {
    ...existing,
    ...updates,
    id: existing.id,
    canonicalId: existing.canonicalId || canonicalId,
    version: nextVersion,
    changelog: updatedChangelog,
    isCanonical: true
  };

  memoryProtocols.set(canonicalId, updatedProtocol);
  if (protocolId !== canonicalId) {
    memoryProtocols.set(protocolId, updatedProtocol);
  }

  const db = getFirestore();
  if (db) {
    try {
      await db
        .collection(PROTOCOLS_COLLECTION)
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
      console.warn('[ProtocolRegistry] Failed to persist protocol version bump:', err);
    }
  }

  return updatedProtocol;
}

export const findCanonicalRoutine = findCanonicalProtocol;
export const saveCanonicalRoutine = saveCanonicalProtocol;
export const updateCanonicalRoutineVersion = updateCanonicalProtocolVersion;
export const toCanonicalRoutine = toCanonicalProtocol;
