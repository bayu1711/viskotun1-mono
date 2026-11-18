import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '../contexts/AuthContext';
import { DEFAULT_CONFIRMATION_SCORE, FEEDBACK_ESCALATION_THRESHOLD } from '../data/config';
import { COPY } from '../data/copy';
import { initialQueuedPapers, routines as initialRoutines, sampleRoutines } from '../data/routines';
import { PRECALIBRATED_SAMPLE_ROUTINES, SAMPLE_PAPERS, type SamplePaper } from '../data/samplePapers';
import type {
  BarrierLog,
  BarrierType,
  ChatMessage,
  DataCollectionField,
  DoseMode,
  FeedbackLog,
  MorphingDataLog,
  NewChatMessage,
  PaperUploadResult,
  ProposedWidgetSpec,
  Routine,
  RoutineRuntime,
  RoutineStep,
  RoutineSummary,
  QueuedPaper
} from '../types/routine';
import { answerFor } from '../utils/assistant';
import { stripClinicalDisclaimer } from '../utils/disclaimer';
import { isEdgeGemmaAvailable, queryEdgeGemma } from '../utils/edgeGemma';
import { createId } from '../utils/id';
import { answerForRejection } from '../utils/rejectionAssistant';
import { clamp, toPercent } from '../utils/math';
import {
  adherenceOf,
  applyGuardrailThreshold,
  completionOf,
  exceedsFeedbackThreshold,
  fieldValueExceedsThreshold,
  getScheduledFieldsForDay,
  isMilestoneDay,
  isProgressionReady,
  isRoutineCompleted,
  momentumOf,
  resolveDataCollectionSpec,
  resolveFeedbackMetric,
  resolveMilestoneDays,
  targetSetsForStep
} from '../utils/routineMetrics';
import { getDaysDifference, getLocalTodayDateString, getMsUntilNextLocalMidnight, nowLabel } from '../utils/time';

function createInitialRuntime(items: Routine[]): Record<string, RoutineRuntime> {
  const todayStr = getLocalTodayDateString();
  return Object.fromEntries(
    items.map((item) => {
      const logs = item.initialFeedbackLogs ?? [];
      const morphLogs = item.initialMorphingLogs ?? [];
      const barrierLogs = item.initialBarrierLogs ?? [];
      return [
        item.id,
        {
          setsDone: { ...item.initialSetsDone },
          excludedStepIds: item.initialExcludedStepIds ?? [],
          feedbackLogs: logs,
          morphingLogs: morphLogs,
          barrierLogs,
          doseMode: item.initialDoseMode ?? 'standard',
          pendingReEntryCheckin: false,
          messages: item.initialMessages,
          escalationPaused: false,
          assistantTyping: false,
          lastActiveDate: item.lastActiveDate || todayStr
        }
      ];
    })
  );
}

function buildMessage(message: NewChatMessage): ChatMessage {
  return { ...message, id: message.id ?? createId('msg'), timestamp: nowLabel() };
}

/** Seeded chat history ships with placeholder times; stamp it with the time the routine was added. */
function stampSeedMessages(messages: ChatMessage[]): ChatMessage[] {
  const timestamp = nowLabel();
  return messages.map((message) => ({ ...message, timestamp }));
}

const STORAGE_VERSION = 'v2';
const STORAGE_KEY_PREFIX = `viskotun1_${STORAGE_VERSION}`;

function getStorageKeys(userId?: string) {
  const scope = userId ? `usr_${userId}` : 'guest';
  return {
    routines: `${STORAGE_KEY_PREFIX}_${scope}_routines`,
    activeId: `${STORAGE_KEY_PREFIX}_${scope}_active_id`,
    runtime: `${STORAGE_KEY_PREFIX}_${scope}_runtime`
  };
}

/** All routine session state + actions. Only raw state is stored; metrics are derived on render. */
export function useRoutineState() {
  const auth = useContext(AuthContext);
  const isAuthLoading = auth?.isLoading ?? false;
  const isAuthenticated = auth?.isAuthenticated;
  const userId = auth?.user?.id;
  const isAdmin = auth?.isAdmin;

  const [routineList, setRoutineList] = useState<Routine[]>([]);
  const [activeRoutineId, setActiveRoutine] = useState<string>('');

  const [queuedPapers, setQueuedPapers] = useState<QueuedPaper[]>(initialQueuedPapers);
  const [isFeedbackDrawerOpen, setIsFeedbackDrawerOpen] = useState(false);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [isBctLedgerOpen, setIsBctLedgerOpen] = useState(false);
  const [isReEntryOpen, setIsReEntryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<Record<string, RoutineRuntime>>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRemoteHydrated, setHasRemoteHydrated] = useState(false);

  const activeRoutineIdRef = useRef(activeRoutineId);
  activeRoutineIdRef.current = activeRoutineId;
  const routineListRef = useRef(routineList);
  routineListRef.current = routineList;
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;
  const rolloverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Staging candidate paper for pre-confirmation review & discussion
  const [stagingRoutine, setStagingRoutine] = useState<Routine | null>(null);
  const [isExtractingPaper, setIsExtractingPaper] = useState(false);
  const [extractingSourceName, setExtractingSourceName] = useState('');
  const [stagingMessages, setStagingMessages] = useState<ChatMessage[]>([]);
  const [stagingError, setStagingError] = useState<string | null>(null);
  const [unboundMessages, setUnboundMessages] = useState<ChatMessage[]>([]);
  const [isStagingAssistantTyping, setIsStagingAssistantTyping] = useState(false);

  // Dynamic sample research papers pulled from Firebase Firestore
  const [samplePapers, setSamplePapers] = useState<SamplePaper[]>(SAMPLE_PAPERS);
  const [sampleRoutinesMap, setSampleRoutinesMap] = useState<Record<string, Routine>>(PRECALIBRATED_SAMPLE_ROUTINES);
  const [sampleSource, setSampleSource] = useState<'firestore-live' | 'memory-cache'>('memory-cache');

  // Pull sample papers from Firebase Firestore on startup
  useEffect(() => {
    let isMounted = true;
    async function fetchFirebaseSamplePapers() {
      try {
        const res = await fetch('/api/papers?type=trending', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const papers = data.trendingPapers || data.samplePapers;
            if (Array.isArray(papers) && papers.length > 0) {
              setSamplePapers(papers);
            }
            const routinesData = data.routines;
            if (routinesData && typeof routinesData === 'object') {
              setSampleRoutinesMap((prev) => ({ ...prev, ...routinesData }));
            }
            if (data.source) {
              setSampleSource(data.source);
            }
          }
        }
      } catch (err) {
        console.warn('[useRoutineState] Could not fetch trending papers from Firebase, using baseline:', err);
      }
    }

    fetchFirebaseSamplePapers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safe client hydration from scoped localStorage and legacy cleanup
  useEffect(() => {
    // Wait until auth session resolution completes to prevent reading wrong scoped storage
    if (isAuthLoading) return;

    let isMounted = true;
    try {
      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      let savedRoutinesRaw = window.localStorage.getItem(keys.routines);
      let savedActiveId = window.localStorage.getItem(keys.activeId);
      let savedRuntimeRaw = window.localStorage.getItem(keys.runtime);

      // Guest -> Authenticated user migration: if user is signed in and has no stored routines,
      // but has routines in guest storage from this browser session, migrate them into the user account
      if (!savedRoutinesRaw && isAuthenticated && userId) {
        const guestKeys = getStorageKeys(undefined);
        const guestRoutinesRaw = window.localStorage.getItem(guestKeys.routines);
        if (guestRoutinesRaw) {
          savedRoutinesRaw = guestRoutinesRaw;
          savedActiveId = savedActiveId || window.localStorage.getItem(guestKeys.activeId);
          savedRuntimeRaw = savedRuntimeRaw || window.localStorage.getItem(guestKeys.runtime);
          try {
            window.localStorage.setItem(keys.routines, guestRoutinesRaw);
            if (savedActiveId) window.localStorage.setItem(keys.activeId, savedActiveId);
            if (savedRuntimeRaw) window.localStorage.setItem(keys.runtime, savedRuntimeRaw);
            window.localStorage.removeItem(guestKeys.routines);
            window.localStorage.removeItem(guestKeys.activeId);
            window.localStorage.removeItem(guestKeys.runtime);
          } catch {
            // Ignore storage write issues
          }
        }
      }

      let loadedRoutines: Routine[] = [];
      if (savedRoutinesRaw) {
        try {
          const parsed = JSON.parse(savedRoutinesRaw);
          if (Array.isArray(parsed)) {
            // Sanitize any legacy sample routines from prior sessions that had Day 4 or pre-filled sets
            loadedRoutines = parsed.map((p) => {
              if (['achilles', 'hair-loss', 'creatine-sleep'].includes(p.id)) {
                if (p.currentDay > 1 || (p.dayHistory && p.dayHistory.length > 0)) {
                  let r: any = null;
                  try {
                    if (savedRuntimeRaw) r = JSON.parse(savedRuntimeRaw)[p.id];
                  } catch {}
                  const hasOnlyMockLogs =
                    !r?.feedbackLogs?.length ||
                    r.feedbackLogs.every((l: any) =>
                      ['ach-log-1', 'ach-log-2', 'ach-log-3', 'hair-log-1', 'hair-log-2', 'hair-log-3', 'cr-log-1'].includes(l.id)
                    );
                  if (hasOnlyMockLogs) {
                    return {
                      ...p,
                      currentDay: 1,
                      dayHistory: [],
                      streak: 0,
                      initialSetsDone: {},
                      initialFeedbackLogs: [],
                      initialMorphingLogs: []
                    };
                  }
                }
              }
              return p;
            });
            if (isMounted) {
              setRoutineList(loadedRoutines);
            }
          }
        } catch (err) {
          console.error('[useRoutineState] Failed parsing scoped routines:', err);
        }
      } else {
        if (isMounted) {
          setRoutineList([]);
        }
      }

      if (savedActiveId && loadedRoutines.some((p) => p.id === savedActiveId)) {
        if (isMounted) setActiveRoutine(savedActiveId);
      } else if (loadedRoutines.length > 0) {
        if (isMounted) setActiveRoutine(loadedRoutines[0].id);
      } else {
        if (isMounted) setActiveRoutine('');
      }

      if (savedRuntimeRaw) {
        try {
          const parsedRuntime = JSON.parse(savedRuntimeRaw);
          if (parsedRuntime && typeof parsedRuntime === 'object') {
            for (const id of ['achilles', 'hair-loss', 'creatine-sleep']) {
              const r = parsedRuntime[id];
              if (r) {
                const hasOnlyMockLogs = r.feedbackLogs?.every((l: any) =>
                  ['ach-log-1', 'ach-log-2', 'ach-log-3', 'hair-log-1', 'hair-log-2', 'hair-log-3', 'cr-log-1'].includes(l.id)
                );
                if (hasOnlyMockLogs && r.feedbackLogs?.length) {
                  r.feedbackLogs = [];
                  r.morphingLogs = [];
                  r.setsDone = {};
                }
              }
            }
            if (isMounted) {
              setRuntime(parsedRuntime);
            }
          }
        } catch (err) {
          console.error('[useRoutineState] Failed parsing scoped runtime:', err);
        }
      } else {
        if (isMounted) {
          setRuntime({});
        }
      }
    } catch (err) {
      console.error('[useRoutineState] Hydration error:', err);
    } finally {
      if (isMounted) {
        setHasHydrated(true);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isAuthenticated, userId]);

  // Persist changes to scoped localStorage once hydrated
  useEffect(() => {
    if (!hasHydrated || isAuthLoading) return;
    const keys = getStorageKeys(isAuthenticated ? userId : undefined);
    try {
      window.localStorage.setItem(keys.routines, JSON.stringify(routineList));
      window.localStorage.setItem(keys.activeId, activeRoutineId);
      window.localStorage.setItem(keys.runtime, JSON.stringify(runtime));
    } catch (err) {
      console.error('[useRoutineState] LocalStorage write error:', err);
    }
  }, [routineList, activeRoutineId, runtime, hasHydrated, isAuthLoading, isAuthenticated, userId]);

  // Fetch cloud state when authenticating as a signed-in user
  useEffect(() => {
    let isMounted = true;
    if (isAuthLoading || !isAuthenticated || !userId) {
      setHasRemoteHydrated(false);
      return;
    }

    async function fetchRemoteState() {
      try {
        const res = await fetch(`/api/user/sync?userId=${encodeURIComponent(userId!)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.found && Array.isArray(data.routines) && data.routines.length > 0) {
              // Sanitize legacy auto-synced default papers if user never made active progress on them
              const isLegacyAutoSynced =
                data.routines.length === 3 &&
                data.routines.every((p: Routine) =>
                  ['achilles', 'hair-loss', 'creatine-sleep'].includes(p.id)
                ) &&
                (!data.runtime ||
                  Object.keys(data.runtime).every((k) => {
                    const r = data.runtime[k];
                    return !r?.feedbackLogs?.length && !r?.morphingLogs?.length;
                  }));

              if (isLegacyAutoSynced) {
                // If local state is also empty or legacy, clean up remote record
                setRoutineList((currentLocal) => {
                  if (
                    currentLocal.length === 0 ||
                    currentLocal.every((p) => ['achilles', 'hair-loss', 'creatine-sleep'].includes(p.id))
                  ) {
                    fetch('/api/user/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId,
                        activeRoutineId: '',
                        routines: [],
                        runtime: {}
                      })
                    }).catch(() => {});
                    setActiveRoutine('');
                    setRuntime({});
                    return [];
                  }
                  return currentLocal;
                });
              } else {
                setRoutineList((currentLocal) => {
                  const remoteList: Routine[] = data.routines;
                  // If local state already has routines not present in remote, merge and preserve them
                  const missingFromRemote = currentLocal.filter(
                    (lp) => !remoteList.some((rp) => rp.id === lp.id)
                  );
                  if (missingFromRemote.length > 0) {
                    const merged = [...remoteList, ...missingFromRemote];
                    fetch('/api/user/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId,
                        activeRoutineId: data.activeRoutineId || merged[0]?.id || '',
                        routines: merged,
                        runtime: { ...(data.runtime || {}), ...runtimeRef.current }
                      })
                    }).catch(() => {});
                    return merged;
                  }
                  return remoteList;
                });

                const targetActiveId = data.activeRoutineId || data.routines?.[0]?.id;
                if (targetActiveId) {
                  setActiveRoutine((curr) => curr || targetActiveId);
                }

                if (data.runtime && typeof data.runtime === 'object') {
                  setRuntime((prev) => {
                    const merged: Record<string, RoutineRuntime> = { ...prev };
                    for (const [id, remoteRt] of Object.entries(data.runtime)) {
                      const remote = remoteRt as RoutineRuntime;
                      if (!merged[id]) {
                        merged[id] = remote;
                      } else {
                        const local = merged[id];
                        // Deduplicate feedback logs by ID
                        const seenLogIds = new Set((remote.feedbackLogs || []).map((l) => l.id));
                        const extraLocalLogs = (local.feedbackLogs || []).filter((l) => !seenLogIds.has(l.id));
                        const mergedFeedback = [...(remote.feedbackLogs || []), ...extraLocalLogs];

                        // Deduplicate morphing logs by ID
                        const seenMorphIds = new Set((remote.morphingLogs || []).map((m) => m.id));
                        const extraLocalMorph = (local.morphingLogs || []).filter((m) => !seenMorphIds.has(m.id));
                        const mergedMorph = [...(remote.morphingLogs || []), ...extraLocalMorph];

                        // Prefer remote setsDone if local is empty or remote has records
                        const localSetsCount = Object.keys(local.setsDone || {}).length;
                        const remoteSetsCount = Object.keys(remote.setsDone || {}).length;
                        const resolvedSetsDone = remoteSetsCount > 0 && localSetsCount === 0 ? remote.setsDone : local.setsDone;

                        merged[id] = {
                          ...local,
                          ...remote,
                          setsDone: resolvedSetsDone,
                          feedbackLogs: mergedFeedback,
                          morphingLogs: mergedMorph,
                          messages: remote.messages?.length ? remote.messages : local.messages,
                          lastActiveDate: remote.lastActiveDate || local.lastActiveDate
                        };
                      }
                    }
                    return merged;
                  });
                }
              }
            } else {
              // Remote returned found=false or empty routines list
              // DO NOT wipe local state! If the user already has routines locally, sync them to remote!
              setRoutineList((currentLocal) => {
                if (currentLocal.length > 0) {
                  fetch('/api/user/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId,
                      activeRoutineId: activeRoutineIdRef.current,
                      routines: currentLocal,
                      runtime: runtimeRef.current
                    })
                  }).catch(() => {});
                  return currentLocal;
                }
                return [];
              });
            }
          }
        }
      } catch (err) {
        console.error('[useRoutineState] Cloud fetch error:', err);
      } finally {
        if (isMounted) {
          setHasRemoteHydrated(true);
        }
      }
    }

    fetchRemoteState();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, isAuthenticated, userId]);

  // Outbound sync to backend once remote state is confirmed/hydrated
  useEffect(() => {
    if (!hasHydrated || isAuthLoading || !isAuthenticated || !userId || !hasRemoteHydrated) return;

    const timer = window.setTimeout(() => {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activeRoutineId,
          routines: routineList,
          runtime
        })
      }).catch((err) => {
        console.error('[useRoutineState] Cloud sync error:', err);
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [routineList, activeRoutineId, runtime, hasHydrated, isAuthLoading, isAuthenticated, userId, hasRemoteHydrated]);

  const resetToDefaults = useCallback(() => {
    if (!isAdmin) {
      console.warn('[useRoutineState] resetToDefaults requires admin privileges.');
      return;
    }

    const keys = getStorageKeys(isAuthenticated ? userId : undefined);
    try {
      window.localStorage.removeItem(keys.routines);
      window.localStorage.removeItem(keys.activeId);
      window.localStorage.removeItem(keys.runtime);
    } catch (err) {
      console.error('[useRoutineState] Error clearing localStorage:', err);
    }

    setRoutineList([]);
    setActiveRoutine('');
    setQueuedPapers(initialQueuedPapers);
    setRuntime({});

    if (isAuthenticated && userId) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activeRoutineId: '',
          routines: [],
          runtime: {}
        })
      }).catch(() => {});
    }

    toast.success(COPY.demo.resetSuccess);
  }, [isAuthenticated, userId, isAdmin]);

  const openHowTo = useCallback(() => setIsHowToOpen(true), []);
  const closeHowTo = useCallback(() => setIsHowToOpen(false), []);

  const openBctLedger = useCallback(() => setIsBctLedgerOpen(true), []);
  const closeBctLedger = useCallback(() => setIsBctLedgerOpen(false), []);

  const openShareModal = useCallback(() => setIsShareModalOpen(true), []);
  const closeShareModal = useCallback(() => setIsShareModalOpen(false), []);

  const loadSampleRoutine = useCallback(
    (sampleId: string, options?: { forceRestart?: boolean }) => {
      const sample =
        sampleRoutinesMap[sampleId] ||
        PRECALIBRATED_SAMPLE_ROUTINES[sampleId] ||
        sampleRoutines.find((p) => p.id === sampleId) ||
        routineList.find((p) => p.id === sampleId);
      if (!sample) {
        toast.error(`Sample routine "${sampleId}" not found`);
        return;
      }

      // Ensure every new user or guest starts on Day 1 with clean history and 0 streak
      const cleanRoutine: Routine = {
        ...sample,
        currentDay: 1,
        dayHistory: [],
        streak: 0,
        lastActiveDate: getLocalTodayDateString(),
        initialSetsDone: {},
        initialFeedbackLogs: [],
        initialMorphingLogs: []
      };

      const initialRuntimeEntry: RoutineRuntime = {
        setsDone: {},
        excludedStepIds: cleanRoutine.initialExcludedStepIds ?? [],
        feedbackLogs: [],
        morphingLogs: [],
        lastActiveDate: getLocalTodayDateString(),
        messages: cleanRoutine.initialMessages?.length
          ? stampSeedMessages(cleanRoutine.initialMessages)
          : [
              {
                id: createId('msg'),
                role: 'ai',
                kind: 'routine',
                content: cleanRoutine.id,
                timestamp: nowLabel()
              }
            ],
        escalationPaused: false,
        assistantTyping: false
      };

      let updatedList: Routine[] = [];
      setRoutineList((prev) => {
        const exists = prev.some((p) => p.id === cleanRoutine.id);
        if (options?.forceRestart) {
          updatedList = exists
            ? prev.map((p) => (p.id === cleanRoutine.id ? cleanRoutine : p))
            : [...prev, cleanRoutine];
        } else {
          updatedList = exists ? prev : [...prev, cleanRoutine];
        }

        // Synchronous write to localStorage guarantees persistence even on immediate page refresh
        const keys = getStorageKeys(isAuthenticated ? userId : undefined);
        try {
          window.localStorage.setItem(keys.routines, JSON.stringify(updatedList));
          window.localStorage.setItem(keys.activeId, cleanRoutine.id);
        } catch {
          // Ignore write restrictions
        }

        return updatedList;
      });

      setActiveRoutine(cleanRoutine.id);

      let updatedRuntime: Record<string, RoutineRuntime> = {};
      setRuntime((prev) => {
        if (options?.forceRestart) {
          updatedRuntime = { ...prev, [cleanRoutine.id]: initialRuntimeEntry };
        } else {
          updatedRuntime = prev[cleanRoutine.id]
            ? prev
            : { ...prev, [cleanRoutine.id]: initialRuntimeEntry };
        }

        const keys = getStorageKeys(isAuthenticated ? userId : undefined);
        try {
          window.localStorage.setItem(keys.runtime, JSON.stringify(updatedRuntime));
        } catch {
          // Ignore write restrictions
        }

        return updatedRuntime;
      });

      // Immediate outbound sync to backend if signed in
      if (isAuthenticated && userId) {
        fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            activeRoutineId: cleanRoutine.id,
            routines: updatedList.length > 0 ? updatedList : [cleanRoutine],
            runtime: Object.keys(updatedRuntime).length > 0 ? updatedRuntime : { [cleanRoutine.id]: initialRuntimeEntry }
          })
        }).catch((err) => {
          console.warn('[loadSampleRoutine] Cloud sync error:', err);
        });
      }

      setIsHowToOpen(false);
      const toastMessage = options?.forceRestart
        ? COPY.howTo.redoToast(cleanRoutine.shortTitle || cleanRoutine.title)
        : COPY.howTo.loadedToast(cleanRoutine.shortTitle || cleanRoutine.title);
      toast.success(toastMessage);
    },
    [sampleRoutinesMap, routineList, isAuthenticated, userId]
  );

  const redoRoutine = useCallback(
    (targetId: string) => loadSampleRoutine(targetId, { forceRestart: true }),
    [loadSampleRoutine]
  );

  const routine = (routineList.find((item) => item.id === activeRoutineId) ?? routineList[0]) || null;
  const state: RoutineRuntime = routine && runtime[routine.id]
    ? runtime[routine.id]
    : {
        setsDone: {},
        feedbackLogs: [],
        morphingLogs: [],
        messages: unboundMessages,
        escalationPaused: false,
        assistantTyping: false
      };

  const updateRuntime = useCallback((id: string, update: (prev: RoutineRuntime) => RoutineRuntime) => {
    setRuntime((prev) => {
      const current = prev[id] ?? {
        setsDone: {},
        feedbackLogs: [],
        morphingLogs: [],
        messages: [],
        escalationPaused: false,
        assistantTyping: false
      };
      return { ...prev, [id]: update(current) };
    });
  }, []);

  // Clinician deep-link parsing: /routine?routineId=... or /routine?id=...
  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('routineId') || params.get('id');
      if (!targetId) return;

      const localFound = routineList.find((r) => r.id === targetId);
      if (localFound) {
        if (activeRoutineId !== targetId) {
          setActiveRoutine(targetId);
          toast.success(COPY.shareModal.deepLinkToast(localFound.shortTitle || localFound.title));
        }
      } else {
        const sampleFound =
          sampleRoutinesMap[targetId] ||
          PRECALIBRATED_SAMPLE_ROUTINES[targetId] ||
          sampleRoutines.find((r) => r.id === targetId);
        if (sampleFound) {
          loadSampleRoutine(targetId);
          toast.success(COPY.shareModal.deepLinkToast(sampleFound.shortTitle || sampleFound.title));
        }
      }

      // Clean the query string from the browser URL bar without page refresh
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } catch {
      // Safe continue
    }
  }, [hasHydrated, routineList, activeRoutineId, sampleRoutinesMap, loadSampleRoutine]);

  const feedbackMetric = useMemo(
    () =>
      routine
        ? resolveFeedbackMetric(routine)
        : {
            name: 'tolerability',
            label: 'symptom / tolerability',
            eyebrow: 'symptom',
            logTitle: 'log',
            minLabel: '0 · minimal',
            maxLabel: '10 · severe',
            maxScore: 10,
            escalationThreshold: FEEDBACK_ESCALATION_THRESHOLD,
            escalationMessage: 'Adverse threshold exceeded. Escalation paused.'
          },
    [routine]
  );
  const dataCollectionSpec = useMemo(
    () => (routine ? resolveDataCollectionSpec(routine) : []),
    [routine]
  );
  const morphingLogs = useMemo(
    () => state.morphingLogs ?? routine?.initialMorphingLogs ?? [],
    [state.morphingLogs, routine?.initialMorphingLogs]
  );
  const isCurrentDayMilestone = useMemo(
    () => (routine ? isMilestoneDay(routine, routine.currentDay) : false),
    [routine]
  );
  const scheduledFields = useMemo(
    () => (routine ? getScheduledFieldsForDay(routine, routine.currentDay) : []),
    [routine]
  );

  const pushMessages = useCallback(
    (id: string, ...messages: NewChatMessage[]) => {
      if (!id) {
        setUnboundMessages((prev) => [...prev, ...messages.map(buildMessage)]);
        return;
      }
      updateRuntime(id, (prev) => ({
        ...prev,
        messages: [...prev.messages, ...messages.map(buildMessage)]
      }));
    },
    [updateRuntime]
  );

  const excludedStepIds = useMemo(() => state.excludedStepIds ?? [], [state.excludedStepIds]);

  const toggleExcludeStep = useCallback(
    (stepId: string) => {
      if (!routine) return;
      updateRuntime(routine.id, (prev) => {
        const current = prev.excludedStepIds ?? [];
        const isExcluded = current.includes(stepId);
        const next = isExcluded ? current.filter((id) => id !== stepId) : [...current, stepId];
        return { ...prev, excludedStepIds: next };
      });
    },
    [routine, updateRuntime]
  );

  const isStepExcluded = useCallback(
    (stepId: string) => (state.excludedStepIds ?? []).includes(stepId),
    [state.excludedStepIds]
  );

  // Derived values
  const currentDoseMode: DoseMode = state.doseMode ?? routine?.initialDoseMode ?? 'standard';
  const todayFraction = routine
    ? completionOf(routine, state.setsDone, state.excludedStepIds ?? [], currentDoseMode)
    : 0;
  const todayPercent = toPercent(todayFraction);
  const activeSteps = useMemo(
    () => (routine ? routine.steps.filter((s) => !(state.excludedStepIds ?? []).includes(s.id)) : []),
    [routine, state.excludedStepIds]
  );
  const dayIsComplete = routine && activeSteps.length > 0 ? todayFraction === 1 : false;
  const isCompleted = routine
    ? isRoutineCompleted(routine, dayIsComplete || todayFraction >= 1)
    : false;
  const adherenceRate = routine ? adherenceOf(routine, todayFraction) : 0;
  const momentum = routine ? momentumOf(routine, todayFraction, routine.streak || 0) : 0;
  const progressionReady = routine
    ? isProgressionReady(
        state.feedbackLogs,
        state.escalationPaused,
        feedbackMetric.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD
      )
    : false;

  const summaries = useMemo<RoutineSummary[]>(
    () =>
      routineList.map((item) => {
        const itemState = runtime[item.id]?.setsDone ?? {};
        const itemExcluded = runtime[item.id]?.excludedStepIds ?? [];
        const itemDose = runtime[item.id]?.doseMode ?? item.initialDoseMode ?? 'standard';
        const fraction = completionOf(item, itemState, itemExcluded, itemDose);
        return {
          id: item.id,
          title: item.title,
          shortTitle: item.shortTitle,
          icon: item.icon,
          currentDay: item.currentDay,
          totalDays: item.totalDays,
          dayHistory: item.dayHistory,
          doi: item.paper?.doi,
          streak: item.streak,
          doseMode: itemDose,
          todayFraction: fraction,
          todayPercent: toPercent(fraction)
        };
      }),
    [routineList, runtime]
  );

  const findStep = useCallback(
    (stepId: string) => (routine ? routine.steps.find((step) => step.id === stepId) : undefined),
    [routine]
  );

  const isStepComplete = useCallback(
    (stepId: string) => {
      if (!routine) return false;
      if ((state.excludedStepIds ?? []).includes(stepId)) return false;
      const step = routine.steps.find((s) => s.id === stepId);
      if (!step) return false;
      const target = targetSetsForStep(step, currentDoseMode);
      return (state.setsDone[stepId] ?? 0) >= target;
    },
    [routine, state.setsDone, state.excludedStepIds, currentDoseMode]
  );

  const updateSetCount = useCallback(
    (stepId: string, next: (current: number, max: number) => number) => {
      if (!routine) return;
      const step = routine.steps.find((s) => s.id === stepId);
      if (!step) return;
      const target = targetSetsForStep(step, currentDoseMode);
      updateRuntime(routine.id, (prev) => ({
        ...prev,
        setsDone: {
          ...prev.setsDone,
          [stepId]: clamp(next(prev.setsDone[stepId] ?? 0, target), 0, target)
        }
      }));
    },
    [routine, updateRuntime, currentDoseMode]
  );

  const incrementSet = useCallback((stepId: string) => updateSetCount(stepId, (current, max) => current + 1), [updateSetCount]);
  const decrementSet = useCallback((stepId: string) => updateSetCount(stepId, (current) => current - 1), [updateSetCount]);
  const toggleStep = useCallback(
    (stepId: string) => updateSetCount(stepId, (current, max) => (current >= max ? 0 : max)),
    [updateSetCount]
  );

  const markTodayComplete = useCallback(() => {
    if (!routine) return;
    const nonExcludedSteps = routine.steps.filter(
      (step) => !(state.excludedStepIds ?? []).includes(step.id)
    );
    const allSetsDone = Object.fromEntries(
      nonExcludedSteps.map((step) => [step.id, targetSetsForStep(step, currentDoseMode)])
    );
    updateRuntime(routine.id, (prev) => ({
      ...prev,
      setsDone: { ...prev.setsDone, ...allSetsDone }
    }));

    if (currentDoseMode === 'micro') {
      toast.success(COPY.reEntry.microDoseCompletedToast);
    }
  }, [routine, state.excludedStepIds, currentDoseMode, updateRuntime]);

  const advanceToNextDay = useCallback(() => {
    if (!routine) return;
    if (routine.currentDay >= routine.totalDays) {
      toast.info(`Already at maximum Day ${routine.totalDays}`);
      return;
    }

    const prevDay = routine.currentDay;
    const nextDay = prevDay + 1;
    const fraction = completionOf(routine, state.setsDone, state.excludedStepIds, currentDoseMode);
    const nextHistory = [...(routine.dayHistory || [])];
    // Record current day's progress (at least 1.0 when manually advancing)
    nextHistory[prevDay - 1] = Math.max(fraction, 1);
    const nextStreak = (routine.streak || 0) + 1;
    const todayStr = getLocalTodayDateString();

    setRoutineList((prev) =>
      prev.map((p) =>
        p.id === routine.id
          ? {
              ...p,
              currentDay: nextDay,
              streak: nextStreak,
              dayHistory: nextHistory,
              lastActiveDate: todayStr
            }
          : p
      )
    );

    updateRuntime(routine.id, (prev) => ({
      ...prev,
      setsDone: {},
      doseMode: 'standard',
      pendingReEntryCheckin: false,
      lastActiveDate: todayStr
    }));

    pushMessages(routine.id, {
      role: 'ai',
      kind: 'confirmation',
      content: COPY.assistant.dayAdvancedConfirmation(prevDay, nextDay)
    });

    toast.success(COPY.dayActions.advancedToast(nextDay));
  }, [routine, state.setsDone, state.excludedStepIds, currentDoseMode, updateRuntime, pushMessages]);

  const setDoseMode = useCallback(
    (mode: DoseMode) => {
      if (!routine) return;
      updateRuntime(routine.id, (prev) => ({
        ...prev,
        doseMode: mode
      }));
    },
    [routine, updateRuntime]
  );

  const logBarrier = useCallback(
    (barrier: BarrierType, selectedDose: DoseMode, note?: string) => {
      if (!routine) return;
      const barrierLabel = COPY.reEntry.barriers[barrier]?.label || barrier;
      const newLog: BarrierLog = {
        id: createId('barr'),
        day: routine.currentDay,
        barrier,
        barrierLabel,
        selectedDoseMode: selectedDose,
        note,
        loggedAt: nowLabel()
      };

      updateRuntime(routine.id, (prev) => ({
        ...prev,
        doseMode: selectedDose,
        barrierLogs: [...(prev.barrierLogs ?? []), newLog],
        pendingReEntryCheckin: false
      }));

      setIsReEntryOpen(false);

      const doseLabel = COPY.reEntry.doseModes[selectedDose]?.title || selectedDose;
      pushMessages(routine.id, {
        role: 'ai',
        kind: 'confirmation',
        content: COPY.assistant.barrierLoggedConfirmation(barrierLabel, doseLabel)
      });

      toast.success(COPY.reEntry.barrierLoggedToast(doseLabel));
    },
    [routine, updateRuntime, pushMessages]
  );

  const dismissReEntryCheckin = useCallback(() => {
    if (!routine) return;
    updateRuntime(routine.id, (prev) => ({
      ...prev,
      pendingReEntryCheckin: false
    }));
    setIsReEntryOpen(false);
  }, [routine, updateRuntime]);

  const openReEntryModal = useCallback(() => {
    setIsReEntryOpen(true);
  }, []);

  const closeReEntryModal = useCallback(() => {
    setIsReEntryOpen(false);
  }, []);

  const simulateLapse = useCallback(
    (days = 3) => {
      if (!routine) return;
      const missedCount = Math.min(days, routine.totalDays - routine.currentDay);
      const nextDay = Math.min(routine.totalDays, routine.currentDay + missedCount);
      const nextHistory = [...(routine.dayHistory || [])];
      for (let d = routine.currentDay; d < nextDay; d++) {
        nextHistory[d - 1] = 0;
      }
      const todayStr = getLocalTodayDateString();

      setRoutineList((prev) =>
        prev.map((p) =>
          p.id === routine.id
            ? {
                ...p,
                currentDay: nextDay,
                dayHistory: nextHistory,
                lastActiveDate: todayStr
              }
            : p
        )
      );

      updateRuntime(routine.id, (prev) => ({
        ...prev,
        setsDone: {},
        pendingReEntryCheckin: true,
        lapseDays: missedCount,
        lastActiveDate: todayStr
      }));

      setIsReEntryOpen(true);

      pushMessages(routine.id, {
        role: 'ai',
        kind: 'confirmation',
        content: COPY.assistant.reEntryWelcome(missedCount, nextDay)
      });

      toast.info(`Simulated ${missedCount}-day lapse. Compassionate re-entry activated.`);
    },
    [routine, updateRuntime, pushMessages]
  );

  const simulatePastDays = useCallback(
    (daysCount = 4) => {
      if (!routine) return;
      const count = Math.min(daysCount, routine.totalDays - 1);
      const targetDay = count + 1;
      const history = Array.from({ length: count }, () => 1.0);
      const todayStr = getLocalTodayDateString();

      const pastFeedbackLogs: FeedbackLog[] = [];
      const pastMorphingLogs: MorphingDataLog[] = [];

      if (routine.id === 'achilles') {
        const achNotes = [
          'Initial eccentric loading, mild morning tendon tenderness',
          'Soreness manageable during lowering phase',
          'Slight ache after bent-knee drops',
          'Discomfort easing, full eccentric sets completed'
        ];
        const achScores = [2, 2, 3, 2];
        for (let i = 1; i <= count; i++) {
          const score = achScores[(i - 1) % achScores.length];
          const note = achNotes[(i - 1) % achNotes.length];
          pastFeedbackLogs.push({
            id: createId('log'),
            day: i,
            score,
            note,
            loggedAt: `Day ${i} · 8:15 AM`
          });
          pastMorphingLogs.push({
            id: createId('morph'),
            fieldId: 'ach-pain-vas',
            day: i,
            value: score,
            loggedAt: `Day ${i} · 8:15 AM`
          });
        }
      } else if (routine.id === 'hair-loss') {
        const hairNotes = [
          'Scalp tolerated 1.5mm dermaroller with mild pinkness',
          'Minoxidil applied 2x daily without irritation',
          'Mild tingling sensation, scalp clear',
          'Regimen well tolerated, adhering strictly to timing'
        ];
        const hairScores = [1, 1, 2, 1];
        for (let i = 1; i <= count; i++) {
          const score = hairScores[(i - 1) % hairScores.length];
          const note = hairNotes[(i - 1) % hairNotes.length];
          pastFeedbackLogs.push({
            id: createId('log'),
            day: i,
            score,
            note,
            loggedAt: `Day ${i} · 8:00 AM`
          });
          pastMorphingLogs.push({
            id: createId('morph'),
            fieldId: 'hair-irritation-scale',
            day: i,
            value: score,
            loggedAt: `Day ${i} · 8:00 AM`
          });
        }
      } else {
        for (let i = 1; i <= count; i++) {
          pastFeedbackLogs.push({
            id: createId('log'),
            day: i,
            score: 1,
            note: `Completed Day ${i} routine as prescribed`,
            loggedAt: `Day ${i} · 8:00 AM`
          });
        }
      }

      setRoutineList((prev) =>
        prev.map((p) =>
          p.id === routine.id
            ? {
                ...p,
                currentDay: targetDay,
                streak: count,
                dayHistory: history,
                lastActiveDate: todayStr
              }
            : p
        )
      );

      updateRuntime(routine.id, (prev) => ({
        ...prev,
        setsDone: {},
        feedbackLogs: pastFeedbackLogs,
        morphingLogs: pastMorphingLogs,
        lastActiveDate: todayStr
      }));

      pushMessages(routine.id, {
        role: 'ai',
        kind: 'confirmation',
        content: COPY.assistant.simulatedHistoryConfirmation(count, targetDay)
      });

      toast.success(COPY.dayActions.simulatedToast(count));
    },
    [routine, updateRuntime, pushMessages]
  );

  const simulateFullCompletion = useCallback(() => {
    if (!routine) return;
    const totalDays = routine.totalDays;
    const history = Array.from({ length: totalDays }, () => 1.0);
    const todayStr = getLocalTodayDateString();

    const pastFeedbackLogs: FeedbackLog[] = [];
    const pastMorphingLogs: MorphingDataLog[] = [];

    const spec = resolveDataCollectionSpec(routine);

    if (routine.id === 'achilles') {
      const achProgressions = [
        { day: 1, score: 3, note: 'Initial eccentric loading, mild morning tendon tenderness', dorsi: 28 },
        { day: 7, score: 3, note: 'Soreness manageable during lowering phase, completing all sets', dorsi: 30 },
        { day: 14, score: 2, note: 'Slight ache after bent-knee drops, adapting well to volume', dorsi: 32 },
        { day: 21, score: 2, note: 'Discomfort easing, full eccentric sets completed smoothly', dorsi: 33 },
        { day: 28, score: 2, note: 'Morning tendon stiffness substantially reduced', dorsi: 35 },
        { day: 42, score: 1, note: 'Eccentric drops feel controlled, minimal discomfort reported', dorsi: 37 },
        { day: 56, score: 1, note: 'Excellent tendon tolerance, progression ready', dorsi: 38 },
        { day: 70, score: 1, note: 'High loading tolerance with zero morning stiffness', dorsi: 40 },
        { day: 84, score: 0, note: 'Final evaluation: completely symptom-free, full tendon strength restored', dorsi: 42 }
      ];

      for (const item of achProgressions) {
        pastFeedbackLogs.push({
          id: createId('log'),
          day: item.day,
          score: item.score,
          note: item.note,
          loggedAt: `Day ${item.day} · 8:15 AM`
        });
        pastMorphingLogs.push({
          id: createId('morph'),
          fieldId: 'ach-pain-vas',
          day: item.day,
          value: item.score,
          loggedAt: `Day ${item.day} · 8:15 AM`
        });
        pastMorphingLogs.push({
          id: createId('morph'),
          fieldId: 'ach-dorsiflexion',
          day: item.day,
          value: item.dorsi,
          loggedAt: `Day ${item.day} · 8:15 AM`
        });
      }
    } else if (routine.id === 'hair-loss') {
      const hairProgressions = [
        { day: 1, score: 2, note: 'Baseline scalp clinical photo captured, 1.5mm dermaroller well tolerated' },
        { day: 14, score: 2, note: 'Minoxidil applied 2x daily without irritation, mild pinkness after microneedling' },
        { day: 28, score: 1, note: 'Mild shedding phase stabilized, early follicular stimulation visible' },
        { day: 56, score: 1, note: 'Visible vellus hair emergence on vertex, excellent scalp compliance' },
        { day: 84, score: 0, note: 'Trial endpoint: documented terminal hair density increase, scalp calm' }
      ];

      for (const item of hairProgressions) {
        pastFeedbackLogs.push({
          id: createId('log'),
          day: item.day,
          score: item.score,
          note: item.note,
          loggedAt: `Day ${item.day} · 8:00 AM`
        });
        pastMorphingLogs.push({
          id: createId('morph'),
          fieldId: 'hair-irritation-scale',
          day: item.day,
          value: item.score,
          loggedAt: `Day ${item.day} · 8:00 AM`
        });
        pastMorphingLogs.push({
          id: createId('morph'),
          fieldId: 'hair-vertex-photo',
          day: item.day,
          value: COPY.morphing.widgets.photo.demoPhotoSvg(`Day ${item.day} Clinical Assessment`),
          loggedAt: `Day ${item.day} · 8:00 AM`
        });
      }
    } else {
      const sampleInterval = Math.max(1, Math.floor(totalDays / 8));
      const sampleDays = Array.from(
        new Set([1, ...Array.from({ length: totalDays }, (_, i) => i + 1).filter((d) => d % sampleInterval === 0), totalDays])
      ).sort((a, b) => a - b);

      for (const day of sampleDays) {
        const isEnd = day === totalDays;
        const progressFraction = day / totalDays;
        const score = Math.max(0, Math.round(2 * (1 - progressFraction)));

        pastFeedbackLogs.push({
          id: createId('log'),
          day,
          score,
          note: isEnd
            ? `Completed final Day ${totalDays} intervention. Full clinical trial routine completed.`
            : `Completed Day ${day} routine as prescribed with high adherence.`,
          loggedAt: `Day ${day} · 8:00 AM`
        });

        for (const field of spec) {
          if (field.type === 'scale') {
            const min = field.min ?? 0;
            const target = field.targetMin ?? min;
            const val = Math.round(target + (field.max ?? 10) * 0.2 * (1 - progressFraction));
            pastMorphingLogs.push({
              id: createId('morph'),
              fieldId: field.id,
              day,
              value: Math.max(min, val),
              loggedAt: `Day ${day} · 8:00 AM`
            });
          } else if (field.type === 'numeric') {
            const target = field.targetMax ?? field.targetMin ?? field.max ?? 50;
            const baseline = field.min ?? 10;
            const val = Math.round(baseline + (target - baseline) * progressFraction);
            pastMorphingLogs.push({
              id: createId('morph'),
              fieldId: field.id,
              day,
              value: val,
              loggedAt: `Day ${day} · 8:00 AM`
            });
          } else if (field.type === 'photo') {
            const milestoneDays = resolveMilestoneDays(field, totalDays);
            if (milestoneDays.includes(day)) {
              pastMorphingLogs.push({
                id: createId('morph'),
                fieldId: field.id,
                day,
                value: COPY.morphing.widgets.photo.demoPhotoSvg(`Day ${day} Clinical Assessment`),
                loggedAt: `Day ${day} · 8:00 AM`
              });
            }
          } else if (field.type === 'timer') {
            pastMorphingLogs.push({
              id: createId('morph'),
              fieldId: field.id,
              day,
              value: field.max ?? 300,
              loggedAt: `Day ${day} · 8:00 AM`
            });
          } else if (field.type === 'boolean') {
            pastMorphingLogs.push({
              id: createId('morph'),
              fieldId: field.id,
              day,
              value: true,
              loggedAt: `Day ${day} · 8:00 AM`
            });
          } else if (field.type === 'multichoice') {
            pastMorphingLogs.push({
              id: createId('morph'),
              fieldId: field.id,
              day,
              value: field.options?.[0] ?? 'Optimal',
              loggedAt: `Day ${day} · 8:00 AM`
            });
          }
        }
      }
    }

    const nonExcludedSteps = routine.steps.filter(
      (step) => !(state.excludedStepIds ?? []).includes(step.id)
    );
    const allSetsDone = Object.fromEntries(nonExcludedSteps.map((step) => [step.id, step.sets]));

    setRoutineList((prev) =>
      prev.map((p) =>
        p.id === routine.id
          ? {
              ...p,
              currentDay: totalDays,
              streak: totalDays,
              dayHistory: history,
              lastActiveDate: todayStr
            }
          : p
      )
    );

    updateRuntime(routine.id, (prev) => ({
      ...prev,
      setsDone: allSetsDone,
      feedbackLogs: pastFeedbackLogs,
      morphingLogs: pastMorphingLogs,
      escalationPaused: false,
      lastActiveDate: todayStr
    }));

    pushMessages(routine.id, {
      role: 'ai',
      kind: 'confirmation',
      content: COPY.assistant.simulatedFullCompletionConfirmation(
        routine.shortTitle || routine.title,
        totalDays
      )
    });

    toast.success(
      COPY.dayActions.simulateFullCompletionToast(routine.shortTitle || routine.title, totalDays)
    );
  }, [routine, state.excludedStepIds, updateRuntime, pushMessages]);

  const checkMidnightRollover = useCallback(() => {
    const todayStr = getLocalTodayDateString();
    const currentRoutines = routineListRef.current;
    if (currentRoutines.length === 0) return;

    let hasAnyChanges = false;
    const runtimeUpdates: Array<{
      id: string;
      isMultiDayLapse: boolean;
      daysPassed: number;
      nextDay: number;
    }> = [];

    const updated = currentRoutines.map((p) => {
      if (!p.lastActiveDate) {
        hasAnyChanges = true;
        return { ...p, lastActiveDate: todayStr };
      }

      const daysPassed = getDaysDifference(p.lastActiveDate, todayStr);
      if (daysPassed <= 0) return p;

      hasAnyChanges = true;
      const currentRt = runtimeRef.current[p.id];
      const currentSets = currentRt?.setsDone ?? {};
      const excluded = currentRt?.excludedStepIds ?? p.initialExcludedStepIds ?? [];
      const currentDose = currentRt?.doseMode ?? p.initialDoseMode ?? 'standard';
      const todayFraction = completionOf(p, currentSets, excluded, currentDose);

      const nextHistory = [...(p.dayHistory || [])];
      if (p.currentDay > 0) {
        nextHistory[p.currentDay - 1] = todayFraction;
      }
      for (let d = p.currentDay + 1; d < p.currentDay + daysPassed; d++) {
        if (d <= p.totalDays) {
          nextHistory[d - 1] = 0;
        }
      }

      const nextDay = Math.min(p.totalDays, p.currentDay + daysPassed);
      const isMultiDayLapse = daysPassed >= 2;
      const streakContinues = todayFraction >= 0.8 && daysPassed === 1;
      // Non-punitive consistency: multi-day lapse preserves streak baseline rather than resetting to 0
      const nextStreak = streakContinues ? (p.streak || 0) + 1 : (isMultiDayLapse ? p.streak || 0 : 0);

      runtimeUpdates.push({ id: p.id, isMultiDayLapse, daysPassed, nextDay });

      return {
        ...p,
        currentDay: nextDay,
        streak: nextStreak,
        dayHistory: nextHistory,
        lastActiveDate: todayStr
      };
    });

    if (!hasAnyChanges) return;

    setRoutineList(updated);

    // Surface multi-day lapses non-intrusively via pendingReEntryCheckin and chat instead of auto-opening a modal on page load
    for (const item of runtimeUpdates) {
      updateRuntime(item.id, (prev) => ({
        ...prev,
        setsDone: {},
        doseMode: 'standard',
        pendingReEntryCheckin: item.isMultiDayLapse,
        lapseDays: item.isMultiDayLapse ? item.daysPassed : undefined,
        lastActiveDate: todayStr
      }));

      pushMessages(item.id, {
        role: 'ai',
        kind: 'confirmation',
        content: item.isMultiDayLapse
          ? COPY.assistant.reEntryWelcome(item.daysPassed, item.nextDay)
          : COPY.assistant.dayRolloverNotification(item.nextDay)
      });
    }
  }, [updateRuntime, pushMessages]);

  useEffect(() => {
    if (!hasHydrated) return;

    checkMidnightRollover();

    function scheduleNextMidnight() {
      const ms = getMsUntilNextLocalMidnight();
      if (rolloverTimerRef.current) {
        clearTimeout(rolloverTimerRef.current);
      }
      rolloverTimerRef.current = setTimeout(() => {
        checkMidnightRollover();
        scheduleNextMidnight();
      }, ms);
    }

    scheduleNextMidnight();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        checkMidnightRollover();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (rolloverTimerRef.current) {
        clearTimeout(rolloverTimerRef.current);
        rolloverTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasHydrated, checkMidnightRollover]);

  const logFeedback = useCallback(
    (score: number, note: string) => {
      if (!routine) return;
      const metric = resolveFeedbackMetric(routine);
      const threshold = metric.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD;
      const exceeded = exceedsFeedbackThreshold(score, threshold);
      const newLog = { id: createId('log'), day: routine.currentDay, score, note, loggedAt: nowLabel() };
      updateRuntime(routine.id, (prev) => {
        const existing = prev.feedbackLogs ?? [];
        const next = [...existing, newLog];
        return {
          ...prev,
          escalationPaused: prev.escalationPaused || exceeded,
          feedbackLogs: next
        };
      });
      pushMessages(
        routine.id,
        exceeded
          ? {
              role: 'ai',
              kind: 'alert',
              content: COPY.safety.dynamicEscalationAlert(metric.name, metric.escalationMessage)
            }
          : { role: 'ai', kind: 'confirmation', content: COPY.assistant.confirmSafe(routine.currentDay, score) }
      );
    },
    [routine, updateRuntime, pushMessages]
  );

  const logMorphingData = useCallback(
    (fieldId: string, value: number | string | boolean, note = '') => {
      if (!routine) return;
      const spec = resolveDataCollectionSpec(routine);
      const field = spec.find((f) => f.id === fieldId) ?? spec[0];
      if (!field) return;
      const isNumeric = typeof value === 'number';
      const exceeded = fieldValueExceedsThreshold(field, value);

      const newMorphLog: MorphingDataLog = {
        id: createId('morph'),
        fieldId,
        day: routine.currentDay,
        value,
        note,
        loggedAt: nowLabel()
      };

      updateRuntime(routine.id, (prev) => {
        const existingMorph = prev.morphingLogs ?? [];
        const nextMorph = [...existingMorph, newMorphLog];

        let nextFeedback = prev.feedbackLogs ?? [];
        if (field.type === 'scale' && isNumeric) {
          nextFeedback = [
            ...nextFeedback,
            { id: createId('log'), day: routine.currentDay, score: value, note, loggedAt: nowLabel() }
          ];
        }

        return {
          ...prev,
          escalationPaused: prev.escalationPaused || exceeded,
          morphingLogs: nextMorph,
          feedbackLogs: nextFeedback
        };
      });

      const displayVal =
        typeof value === 'boolean'
          ? value
            ? COPY.morphing.values.present
            : COPY.morphing.values.absent
          : typeof value === 'string' && value.startsWith('data:')
          ? COPY.morphing.values.photoAttached
          : `${value}${field.unit ? ' ' + field.unit : ''}`;

      pushMessages(
        routine.id,
        exceeded
          ? {
              role: 'ai',
              kind: 'alert',
              content: COPY.safety.dynamicEscalationAlert(field.name, field.escalationMessage)
            }
          : {
              role: 'ai',
              kind: 'confirmation',
              content: COPY.morphing.values.fieldConfirmation(field.name, routine.currentDay, displayVal)
            }
      );
    },
    [routine, updateRuntime, pushMessages]
  );

  const askQuestion = useCallback(
    async (text: string) => {
      if (!routine) {
        toast.info(COPY.errors.noRoutinesBody);
        return;
      }
      const target = routine;
      pushMessages(target.id, { role: 'user', kind: 'question', content: text });
      updateRuntime(target.id, (prev) => ({ ...prev, assistantTyping: true }));

      // Tier 1: Try Edge Gemma (Chrome Built-in AI on-device)
      try {
        const canUseEdgeGemma = await isEdgeGemmaAvailable();
        if (canUseEdgeGemma) {
          const edgeAnswer = await queryEdgeGemma(target, text);
          if (edgeAnswer) {
            pushMessages(target.id, {
              role: 'ai',
              kind: 'answer',
              content: edgeAnswer,
              engine: 'on-device-gemma',
              source: COPY.assistant.engines.onDeviceGemmaSource
            });
            return;
          }
        }
      } catch (edgeErr) {
        console.info('[useRoutineState] Edge Gemma bypassed, routing to API:', edgeErr);
      }

      // Tier 2: Cloud Gemini / Server Gemma Route Handler
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text,
            routineTitle: target.title,
            shortTitle: target.shortTitle,
            faqs: target.faqs,
            contraindications: target.contraindications,
            steps: target.steps,
            progressionRules: target.progressionRules,
            feedbackMetric: target.feedbackMetric,
            paper: target.paper,
            missingDataFlags: target.missingDataFlags
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.answer) {
            pushMessages(target.id, {
              role: 'ai',
              kind: 'answer',
              content: stripClinicalDisclaimer(data.answer),
              engine: data.engine ?? 'cloud-gemini',
              source: data.source ?? COPY.assistant.methodsSectionSource
            });
            return;
          }
        }

        // Tier 3: Deterministic Local Paper Rule Engine
        pushMessages(target.id, {
          role: 'ai',
          kind: 'answer',
          content: stripClinicalDisclaimer(answerFor(target, text)),
          engine: 'local-rules',
          source: COPY.assistant.methodsSectionSource
        });
      } catch {
        pushMessages(target.id, {
          role: 'ai',
          kind: 'answer',
          content: stripClinicalDisclaimer(answerFor(target, text)),
          engine: 'local-rules',
          source: COPY.assistant.methodsSectionSource
        });
      } finally {
        updateRuntime(target.id, (prev) => ({ ...prev, assistantTyping: false }));
      }
    },
    [routine, pushMessages, updateRuntime]
  );

  const askAboutStep = useCallback(
    (step: RoutineStep) => {
      askQuestion(COPY.task.taskQuestionPrompt(step.action));
    },
    [askQuestion]
  );

  const addRoutine = useCallback((newRoutine: Routine) => {
    let updatedList: Routine[] = [];
    setRoutineList((prev) => {
      const exists = prev.some((p) => p.id === newRoutine.id);
      updatedList = exists ? prev.map((p) => (p.id === newRoutine.id ? newRoutine : p)) : [...prev, newRoutine];

      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      try {
        window.localStorage.setItem(keys.routines, JSON.stringify(updatedList));
        window.localStorage.setItem(keys.activeId, newRoutine.id);
      } catch {
        // Ignore
      }

      return updatedList;
    });

    const newRuntimeEntry: RoutineRuntime = {
      setsDone: { ...(newRoutine.initialSetsDone ?? {}) },
      excludedStepIds: newRoutine.initialExcludedStepIds ?? [],
      feedbackLogs: newRoutine.initialFeedbackLogs ?? [],
      messages: stampSeedMessages(newRoutine.initialMessages ?? []),
      escalationPaused: false,
      assistantTyping: false
    };

    let updatedRuntime: Record<string, RoutineRuntime> = {};
    setRuntime((prev) => {
      updatedRuntime = { ...prev, [newRoutine.id]: newRuntimeEntry };
      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      try {
        window.localStorage.setItem(keys.runtime, JSON.stringify(updatedRuntime));
      } catch {
        // Ignore
      }
      return updatedRuntime;
    });

    setActiveRoutine(newRoutine.id);

    if (isAuthenticated && userId) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activeRoutineId: newRoutine.id,
          routines: updatedList.length > 0 ? updatedList : [newRoutine],
          runtime: Object.keys(updatedRuntime).length > 0 ? updatedRuntime : { [newRoutine.id]: newRuntimeEntry }
        })
      }).catch((err) => {
        console.warn('[addRoutine] Cloud sync error:', err);
      });
    }
  }, [isAuthenticated, userId]);

  const uploadPaper = useCallback(
    async (source: string | File, extractedRoutine?: Routine): Promise<PaperUploadResult> => {
      if (extractedRoutine) {
        setStagingRoutine(extractedRoutine);
        setStagingError(null);
        setStagingMessages([
          {
            id: createId('msg'),
            role: 'user',
            kind: 'file',
            content: extractedRoutine.paper?.title || extractedRoutine.title,
            timestamp: nowLabel()
          },
          {
            id: createId('msg'),
            role: 'ai',
            kind: 'candidate',
            content: extractedRoutine.id,
            timestamp: nowLabel()
          }
        ]);
        return { success: true, eligible: true, routine: extractedRoutine };
      }

      const fileName = typeof source === 'string' ? source : source.name;
      setStagingRoutine(null);
      setStagingError(null);
      setIsExtractingPaper(true);
      setExtractingSourceName(fileName);
      setStagingMessages([
        {
          id: createId('msg'),
          role: 'user',
          kind: 'file',
          content: fileName,
          timestamp: nowLabel()
        }
      ]);

      try {
        const formData = new FormData();
        if (typeof source === 'string') {
          formData.append('url', source);
        } else {
          formData.append('file', source);
        }

        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          throw new Error(COPY.extraction.failedWithStatus(res.status));
        }

        const result = await res.json();
        const extractedRoutine = result.routine;

        if (result.eligible && extractedRoutine) {
          setStagingRoutine(extractedRoutine);
          setStagingMessages((prev) => [
            ...prev,
            {
              id: createId('msg'),
              role: 'ai',
              kind: 'candidate',
              content: extractedRoutine.id,
              timestamp: nowLabel()
            }
          ]);
          toast.success(COPY.processing.ready);
          return { success: true, eligible: true, routine: extractedRoutine };
        } else {
          const reason = result.rejectionReason || COPY.extraction.declinedNonHuman;
          setStagingError(reason);
          setStagingMessages((prev) => [
            ...prev,
            {
              id: createId('msg'),
              role: 'ai',
              kind: 'alert',
              content: reason,
              timestamp: nowLabel()
            }
          ]);
          toast.error(reason);
          return { success: false, eligible: false, reason };
        }
      } catch (err) {
        console.error('[uploadPaper] Extraction failed:', err);
        const errorMsg = COPY.extraction.errorGeneral;
        setStagingError(errorMsg);
        setStagingMessages((prev) => [
          ...prev,
          {
            id: createId('msg'),
            role: 'ai',
            kind: 'alert',
            content: errorMsg,
            timestamp: nowLabel()
          }
        ]);
        toast.error(errorMsg);
        return { success: false, eligible: false, reason: errorMsg };
      } finally {
        setIsExtractingPaper(false);
      }
    },
    []
  );

  const clearStagingError = useCallback(() => {
    setStagingError(null);
    if (!stagingRoutine) {
      setStagingMessages([]);
    }
  }, [stagingRoutine]);

  const confirmStagingRoutine = useCallback(() => {
    if (!stagingRoutine) return;
    const target = stagingRoutine;
    addRoutine(target);

    // Persist uploaded paper to unified Firebase papers collection
    fetch('/api/papers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paper: {
          id: target.id,
          title: target.paper?.title || target.title,
          shortTitle: target.shortTitle,
          domain: target.phase || 'Clinical Research',
          category: 'rehab',
          authors: target.paper?.authors || 'Unknown Authors',
          journal: target.paper?.journal || 'Clinical Trial',
          year: target.paper?.year || new Date().getFullYear(),
          doi: target.paper?.doi || '',
          openAccessUrl: target.paper?.doi ? `https://doi.org/${target.paper?.doi}` : '',
          pdfUrl: '',
          summary: target.steps?.map((s: RoutineStep) => s.action).join('. ') || '',
          featuresTested: target.steps?.map((s: RoutineStep) => s.action) || [],
          routineId: target.id,
          isSample: false,
          userId: userId || 'guest'
        },
        routine: target
      })
    }).catch((err) => {
      console.warn('[confirmStagingRoutine] Could not persist to Firebase papers collection:', err);
    });

    const displayTitle = target.shortTitle || target.title;
    setStagingRoutine(null);
    setStagingMessages([]);
    setStagingError(null);
    toast.success(COPY.assistant.confirmedToast(displayTitle));
  }, [stagingRoutine, addRoutine, userId]);

  const discardStagingRoutine = useCallback(() => {
    setStagingRoutine(null);
    setStagingMessages([]);
    setStagingError(null);
    setIsExtractingPaper(false);
    toast.info(COPY.assistant.discardedToast);
  }, []);

  const askStagingQuestion = useCallback(
    async (text: string) => {
      if (!stagingRoutine && !stagingError) return;
      const userMsg: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        kind: 'question',
        content: text,
        timestamp: nowLabel()
      };
      setStagingMessages((prev) => [...prev, userMsg]);
      setIsStagingAssistantTyping(true);

      if (!stagingRoutine && stagingError) {
        try {
          const res = await fetch('/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: text,
              rejectionReason: stagingError,
              rejectedFileName: extractingSourceName
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (data?.answer) {
              setStagingMessages((prev) => [
                ...prev,
                {
                  id: createId('msg'),
                  role: 'ai',
                  kind: 'answer',
                  content: stripClinicalDisclaimer(data.answer),
                  engine: data.engine ?? 'local-rules',
                  source: data.source ?? COPY.assistant.rejection.source,
                  timestamp: nowLabel()
                }
              ]);
              return;
            }
          }

          setStagingMessages((prev) => [
            ...prev,
            {
              id: createId('msg'),
              role: 'ai',
              kind: 'answer',
              content: answerForRejection(stagingError, text),
              engine: 'local-rules',
              source: COPY.assistant.rejection.source,
              timestamp: nowLabel()
            }
          ]);
        } catch {
          setStagingMessages((prev) => [
            ...prev,
            {
              id: createId('msg'),
              role: 'ai',
              kind: 'answer',
              content: answerForRejection(stagingError, text),
              engine: 'local-rules',
              source: COPY.assistant.rejection.source,
              timestamp: nowLabel()
            }
          ]);
        } finally {
          setIsStagingAssistantTyping(false);
        }
        return;
      }

      const target = stagingRoutine!;

      try {
        const canUseEdgeGemma = await isEdgeGemmaAvailable();
        if (canUseEdgeGemma) {
          const edgeAnswer = await queryEdgeGemma(target, text);
          if (edgeAnswer) {
            setStagingMessages((prev) => [
              ...prev,
              {
                id: createId('msg'),
                role: 'ai',
                kind: 'answer',
                content: edgeAnswer,
                engine: 'on-device-gemma',
                source: COPY.assistant.engines.onDeviceGemmaSource,
                timestamp: nowLabel()
              }
            ]);
            return;
          }
        }
      } catch (edgeErr) {
        console.info('[askStagingQuestion] Edge Gemma bypassed:', edgeErr);
      }

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text,
            routineTitle: target.title,
            shortTitle: target.shortTitle,
            faqs: target.faqs,
            contraindications: target.contraindications,
            steps: target.steps,
            progressionRules: target.progressionRules,
            feedbackMetric: target.feedbackMetric,
            paper: target.paper,
            missingDataFlags: target.missingDataFlags
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.answer) {
            setStagingMessages((prev) => [
              ...prev,
              {
                id: createId('msg'),
                role: 'ai',
                kind: 'answer',
                content: stripClinicalDisclaimer(data.answer),
                engine: data.engine ?? 'cloud-gemini',
                source: data.source ?? COPY.assistant.methodsSectionSource,
                timestamp: nowLabel()
              }
            ]);
            return;
          }
        }

        setStagingMessages((prev) => [
          ...prev,
          {
            id: createId('msg'),
            role: 'ai',
            kind: 'answer',
            content: stripClinicalDisclaimer(answerFor(target, text)),
            engine: 'local-rules',
            source: COPY.assistant.methodsSectionSource,
            timestamp: nowLabel()
          }
        ]);
      } catch {
        setStagingMessages((prev) => [
          ...prev,
          {
            id: createId('msg'),
            role: 'ai',
            kind: 'answer',
            content: stripClinicalDisclaimer(answerFor(target, text)),
            engine: 'local-rules',
            source: COPY.assistant.methodsSectionSource,
            timestamp: nowLabel()
          }
        ]);
      } finally {
        setIsStagingAssistantTyping(false);
      }
    },
    [stagingRoutine, stagingError, extractingSourceName]
  );

  const toggleStagingExcludeStep = useCallback((stepId: string) => {
    setStagingRoutine((prev) => {
      if (!prev) return prev;
      const current = prev.initialExcludedStepIds ?? [];
      const isExcluded = current.includes(stepId);
      const next = isExcluded ? current.filter((id) => id !== stepId) : [...current, stepId];
      return { ...prev, initialExcludedStepIds: next };
    });
  }, []);

  const openFeedbackDrawer = useCallback((fieldId?: string) => {
    if (fieldId) {
      setActiveFieldId(fieldId);
    }
    setIsFeedbackDrawerOpen(true);
  }, []);
  const closeFeedbackDrawer = useCallback(() => {
    setIsFeedbackDrawerOpen(false);
    setActiveFieldId(null);
  }, []);

  const openReviewDrawer = useCallback(() => {
    setIsReviewDrawerOpen(true);
  }, []);

  const closeReviewDrawer = useCallback(() => {
    setIsReviewDrawerOpen(false);
  }, []);

  const submitCommunityReview = useCallback(
    async (reviewData: {
      outcome: 'improved' | 'adjusted' | 'paused';
      text: string;
      handle?: string;
      day?: number;
      adherence?: number;
      lifestyleCohort?: 'smoker' | 'non_smoker' | 'ramadan' | 'shift_work' | 'general';
      tags?: string[];
    }) => {
      if (!routine) return;

      const payload = {
        routineId: routine.id,
        outcome: reviewData.outcome,
        text: reviewData.text,
        handle: reviewData.handle,
        day: reviewData.day ?? routine.currentDay,
        adherence: reviewData.adherence ?? adherenceRate,
        userId: userId || undefined,
        lifestyleCohort: reviewData.lifestyleCohort,
        tags: reviewData.tags
      };

      try {
        const res = await fetch('/api/community/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error('Failed to submit review');
        }

        const data = await res.json();
        if (data.success && data.review) {
          setRoutineList((prev) =>
            prev.map((p) => {
              if (p.id !== routine.id) return p;
              const existingReviews = p.community?.reviews || [];
              const updatedReviews = [
                data.review,
                ...existingReviews.filter((r) => r.id !== data.review.id)
              ];
              return {
                ...p,
                community: {
                  ...p.community,
                  ...(data.metrics || {}),
                  reviews: updatedReviews
                }
              };
            })
          );
          toast.success(COPY.community.reviewSuccessToast);
          closeReviewDrawer();
        }
      } catch (err) {
        console.error('[submitCommunityReview] Error:', err);
        toast.error(COPY.community.reviewErrorToast);
      }
    },
    [routine, adherenceRate, userId, closeReviewDrawer]
  );

  const tuneLifestyle = useCallback(
    async (message: string) => {
      const currentProf = auth?.lifestyleProfile;
      const country = currentProf?.region?.countryCode || 'AE';
      const targetId = routine?.id || '';

      pushMessages(targetId, {
        role: 'user',
        kind: 'question',
        content: message
      });
      if (targetId) {
        updateRuntime(targetId, (prev) => ({ ...prev, assistantTyping: true }));
      }

      try {
        const res = await fetch('/api/lifestyle/tune', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            country,
            currentProfile: currentProf
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.profileUpdates && auth?.updateLifestyleProfile) {
            auth.updateLifestyleProfile(data.profileUpdates);
          }
          pushMessages(targetId, {
            role: 'ai',
            kind: 'confirmation',
            content: data.reply
          });
          toast.success(COPY.lifestyleTuning.tagAddedToast(data.extractedTags?.[0] || 'Lifestyle'));
          return data;
        }
      } catch (err) {
        console.warn('[useRoutineState] Lifestyle tune failed:', err);
      } finally {
        if (targetId) {
          updateRuntime(targetId, (prev) => ({ ...prev, assistantTyping: false }));
        }
      }
      return null;
    },
    [auth, routine, pushMessages, updateRuntime]
  );

  const updateGuardrailThreshold = useCallback(
    (threshold: number, message?: string) => {
      if (!routine || applyGuardrailThreshold(routine, threshold, message) === routine) return;
      setRoutineList((prev) =>
        prev.map((p) => (p.id === routine.id ? applyGuardrailThreshold(p, threshold, message) : p))
      );
    },
    [routine]
  );

  const approveProposedWidget = useCallback((proposal: ProposedWidgetSpec) => {
    const applyApproval = (p: Routine): Routine => {
      if (!p.dataCollectionSpec) return p;
      const matches = p.dataCollectionSpec.some(
        (f) => f.proposedWidget?.id === proposal.id || (p.id === proposal.routineId && f.id === proposal.fieldId)
      );
      if (!matches) return p;
      return {
        ...p,
        dataCollectionSpec: p.dataCollectionSpec.map((f) =>
          f.proposedWidget?.id === proposal.id || (p.id === proposal.routineId && f.id === proposal.fieldId)
            ? { ...f, proposedWidget: { ...proposal, status: 'approved' } }
            : f
        )
      };
    };

    setRoutineList((prev) => prev.map(applyApproval));
    setStagingRoutine((prev) => (prev ? applyApproval(prev) : null));
  }, []);

  return useMemo(
    () => ({
      routines: summaries,
      queuedPapers,
      activeRoutineId: routine?.id ?? '',
      setActiveRoutine,
      routine,
      hasRoutines: routineList.length > 0,
      currentDay: routine?.currentDay ?? 1,
      totalDays: routine?.totalDays ?? 14,
      streak: routine?.streak ?? 0,
      messages: state.messages,
      setsDone: state.setsDone,
      feedbackLogs: state.feedbackLogs ?? [],
      morphingLogs,
      dataCollectionSpec,
      activeFieldId,
      setActiveFieldId,
      isCurrentDayMilestone,
      scheduledFields,
      escalationPaused: state.escalationPaused,
      feedbackMetric,
      todayFraction,
      todayPercent,
      adherenceRate,
      momentum,
      dayIsComplete,
      isCompleted,
      progressionReady,
      doseMode: currentDoseMode,
      setDoseMode,
      barrierLogs: state.barrierLogs ?? [],
      logBarrier,
      isReEntryOpen,
      openReEntryModal,
      closeReEntryModal,
      dismissReEntryCheckin,
      pendingReEntryCheckin: Boolean(state.pendingReEntryCheckin),
      lapseDays: state.lapseDays ?? 0,
      simulateLapse,
      assistantTyping: state.assistantTyping ?? false,
      isFeedbackDrawerOpen,
      openFeedbackDrawer,
      closeFeedbackDrawer,
      isReviewDrawerOpen,
      openReviewDrawer,
      closeReviewDrawer,
      submitCommunityReview,
      isHowToOpen,
      openHowTo,
      closeHowTo,
      isBctLedgerOpen,
      openBctLedger,
      closeBctLedger,
      isShareModalOpen,
      openShareModal,
      closeShareModal,
      loadTrendingRoutine: loadSampleRoutine,
      loadSampleRoutine,
      redoRoutine,
      trendingPapers: samplePapers,
      samplePapers,
      sampleSource,
      isStepComplete,
      excludedStepIds,
      toggleExcludeStep,
      isStepExcluded,
      incrementSet,
      decrementSet,
      toggleStep,
      markTodayComplete,
      advanceToNextDay,
      simulatePastDays,
      simulateFullCompletion,
      isAdmin: Boolean(isAdmin),
      logFeedback,
      logMorphingData,
      askQuestion,
      askAboutStep,
      uploadPaper,
      stagingRoutine,
      isExtractingPaper,
      extractingSourceName,
      stagingMessages,
      stagingError,
      clearStagingError,
      isStagingAssistantTyping,
      confirmStagingRoutine,
      discardStagingRoutine,
      askStagingQuestion,
      toggleStagingExcludeStep,
      addRoutine,
      lifestyleProfile: auth?.lifestyleProfile,
      updateLifestyleProfile: auth?.updateLifestyleProfile,
      confirmRegion: auth?.confirmRegion,
      tuneLifestyle,
      resetToDefaults,
      updateGuardrailThreshold,
      approveProposedWidget,
      hasHydrated
    }),
    [
      summaries,
      queuedPapers,
      routine,
      routineList.length,
      state.messages,
      state.setsDone,
      state.feedbackLogs,
      state.barrierLogs,
      state.pendingReEntryCheckin,
      state.lapseDays,
      currentDoseMode,
      morphingLogs,
      dataCollectionSpec,
      activeFieldId,
      isCurrentDayMilestone,
      scheduledFields,
      state.escalationPaused,
      feedbackMetric,
      state.assistantTyping,
      todayFraction,
      todayPercent,
      adherenceRate,
      momentum,
      dayIsComplete,
      isCompleted,
      progressionReady,
      isFeedbackDrawerOpen,
      openFeedbackDrawer,
      closeFeedbackDrawer,
      isReviewDrawerOpen,
      openReviewDrawer,
      closeReviewDrawer,
      submitCommunityReview,
      isHowToOpen,
      openHowTo,
      closeHowTo,
      isBctLedgerOpen,
      openBctLedger,
      closeBctLedger,
      isShareModalOpen,
      openShareModal,
      closeShareModal,
      isReEntryOpen,
      openReEntryModal,
      closeReEntryModal,
      dismissReEntryCheckin,
      setDoseMode,
      logBarrier,
      simulateLapse,
      loadSampleRoutine,
      redoRoutine,
      samplePapers,
      sampleSource,
      isStepComplete,
      excludedStepIds,
      toggleExcludeStep,
      isStepExcluded,
      incrementSet,
      decrementSet,
      toggleStep,
      markTodayComplete,
      advanceToNextDay,
      simulatePastDays,
      simulateFullCompletion,
      isAdmin,
      logFeedback,
      logMorphingData,
      askQuestion,
      askAboutStep,
      uploadPaper,
      stagingRoutine,
      isExtractingPaper,
      extractingSourceName,
      stagingMessages,
      stagingError,
      clearStagingError,
      isStagingAssistantTyping,
      confirmStagingRoutine,
      discardStagingRoutine,
      askStagingQuestion,
      toggleStagingExcludeStep,
      addRoutine,
      auth?.lifestyleProfile,
      auth?.updateLifestyleProfile,
      auth?.confirmRegion,
      tuneLifestyle,
      resetToDefaults,
      updateGuardrailThreshold,
      approveProposedWidget,
      hasHydrated
    ]
  );
}

export type RoutineState = ReturnType<typeof useRoutineState>;
