import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '../contexts/AuthContext';
import { DEFAULT_CONFIRMATION_SCORE, FEEDBACK_ESCALATION_THRESHOLD } from '../data/config';
import { COPY } from '../data/copy';
import { initialQueuedPapers, protocols as initialProtocols, sampleProtocols } from '../data/protocols';
import { PRECALIBRATED_SAMPLE_PROTOCOLS, SAMPLE_PAPERS, type SamplePaper } from '../data/samplePapers';
import type {
  ChatMessage,
  DataCollectionField,
  MorphingDataLog,
  NewChatMessage,
  Protocol,
  ProtocolRuntime,
  ProtocolStep,
  ProtocolSummary,
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
import { clamp, toPercent } from '../utils/math';
import {
  adherenceOf,
  completionOf,
  exceedsFeedbackThreshold,
  getScheduledFieldsForDay,
  isMilestoneDay,
  isProgressionReady,
  resolveDataCollectionSpec,
  resolveFeedbackMetric
} from '../utils/routineMetrics';
import { nowLabel } from '../utils/time';

function createInitialRuntime(items: Routine[]): Record<string, RoutineRuntime> {
  return Object.fromEntries(
    items.map((item) => {
      const logs = item.initialFeedbackLogs ?? [];
      const morphLogs = item.initialMorphingLogs ?? [];
      return [
        item.id,
        {
          setsDone: { ...item.initialSetsDone },
          excludedStepIds: item.initialExcludedStepIds ?? [],
          feedbackLogs: logs,
          morphingLogs: morphLogs,
          messages: item.initialMessages,
          escalationPaused: false,
          assistantTyping: false
        }
      ];
    })
  );
}

function buildMessage(message: NewChatMessage): ChatMessage {
  return { ...message, id: message.id ?? createId('msg'), timestamp: nowLabel() };
}

const STORAGE_VERSION = 'v2';
const STORAGE_KEY_PREFIX = `viskotun1_${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEY_PREFIX = `protocol_engine_${STORAGE_VERSION}`;

function getStorageKeys(userId?: string) {
  const scope = userId ? `usr_${userId}` : 'guest';
  return {
    routines: `${STORAGE_KEY_PREFIX}_${scope}_routines`,
    activeId: `${STORAGE_KEY_PREFIX}_${scope}_active_id`,
    runtime: `${STORAGE_KEY_PREFIX}_${scope}_runtime`,
    // Legacy migration keys
    legacyProtocols: `${LEGACY_STORAGE_KEY_PREFIX}_${scope}_protocols`,
    legacyActiveId: `${LEGACY_STORAGE_KEY_PREFIX}_${scope}_active_id`,
    legacyRuntime: `${LEGACY_STORAGE_KEY_PREFIX}_${scope}_runtime`
  };
}

/** All routine session state + actions. Only raw state is stored; metrics are derived on render. */
export function useRoutineState() {
  const auth = useContext(AuthContext);
  const isAuthLoading = auth?.isLoading ?? false;
  const isAuthenticated = auth?.isAuthenticated;
  const userId = auth?.user?.id;
  const isAdmin = auth?.isAdmin;

  const [protocolList, setProtocolList] = useState<Protocol[]>([]);
  const [activeProtocolId, setActiveProtocol] = useState<string>('');
  const [queuedPapers, setQueuedPapers] = useState<QueuedPaper[]>(initialQueuedPapers);
  const [isFeedbackDrawerOpen, setIsFeedbackDrawerOpen] = useState(false);
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<Record<string, ProtocolRuntime>>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRemoteHydrated, setHasRemoteHydrated] = useState(false);

  const activeProtocolIdRef = useRef(activeProtocolId);
  activeProtocolIdRef.current = activeProtocolId;
  const runtimeRef = useRef(runtime);
  runtimeRef.current = runtime;

  // Staging candidate paper for pre-confirmation review & discussion
  const [stagingProtocol, setStagingProtocol] = useState<Protocol | null>(null);
  const [isExtractingPaper, setIsExtractingPaper] = useState(false);
  const [extractingSourceName, setExtractingSourceName] = useState('');
  const [stagingMessages, setStagingMessages] = useState<ChatMessage[]>([]);
  const [stagingError, setStagingError] = useState<string | null>(null);
  const [isStagingAssistantTyping, setIsStagingAssistantTyping] = useState(false);

  // Dynamic sample research papers pulled from Firebase Firestore
  const [samplePapers, setSamplePapers] = useState<SamplePaper[]>(SAMPLE_PAPERS);
  const [sampleProtocolsMap, setSampleProtocolsMap] = useState<Record<string, Protocol>>(PRECALIBRATED_SAMPLE_PROTOCOLS);
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
            if (data.protocols && typeof data.protocols === 'object') {
              setSampleProtocolsMap((prev) => ({ ...prev, ...data.protocols }));
            }
            if (data.source) {
              setSampleSource(data.source);
            }
          }
        }
      } catch (err) {
        console.warn('[useProtocolState] Could not fetch trending papers from Firebase, using baseline:', err);
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
      // Clean up legacy v1 storage keys that may contain old default pre-seeded papers
      window.localStorage.removeItem('protocol_engine_protocols_v1');
      window.localStorage.removeItem('protocol_engine_active_id_v1');
      window.localStorage.removeItem('protocol_engine_runtime_v1');

      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      let savedRoutinesRaw = window.localStorage.getItem(keys.routines);
      let savedActiveId = window.localStorage.getItem(keys.activeId);
      let savedRuntimeRaw = window.localStorage.getItem(keys.runtime);

      // Auto-migrate from protocol_engine_v2 if viskotun1_v2 is not yet present
      if (!savedRoutinesRaw) {
        const legacyProtocols = window.localStorage.getItem(keys.legacyProtocols);
        if (legacyProtocols) {
          savedRoutinesRaw = legacyProtocols;
          savedActiveId = savedActiveId || window.localStorage.getItem(keys.legacyActiveId);
          savedRuntimeRaw = savedRuntimeRaw || window.localStorage.getItem(keys.legacyRuntime);
        }
      }

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

      let loadedProtocols: Routine[] = [];
      if (savedRoutinesRaw) {
        try {
          const parsed = JSON.parse(savedRoutinesRaw);
          if (Array.isArray(parsed)) {
            // Sanitize any legacy sample protocols from prior sessions that had Day 4 or pre-filled sets
            loadedProtocols = parsed.map((p) => {
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
              setProtocolList(loadedProtocols);
            }
          }
        } catch (err) {
          console.error('[useRoutineState] Failed parsing scoped routines:', err);
        }
      } else {
        if (isMounted) {
          setProtocolList([]);
        }
      }

      if (savedActiveId && loadedProtocols.some((p) => p.id === savedActiveId)) {
        if (isMounted) setActiveProtocol(savedActiveId);
      } else if (loadedProtocols.length > 0) {
        if (isMounted) setActiveProtocol(loadedProtocols[0].id);
      } else {
        if (isMounted) setActiveProtocol('');
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
      window.localStorage.setItem(keys.routines, JSON.stringify(protocolList));
      window.localStorage.setItem(keys.activeId, activeProtocolId);
      window.localStorage.setItem(keys.runtime, JSON.stringify(runtime));
    } catch (err) {
      console.error('[useRoutineState] LocalStorage write error:', err);
    }
  }, [protocolList, activeProtocolId, runtime, hasHydrated, isAuthLoading, isAuthenticated, userId]);

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
            if (data.found && Array.isArray(data.protocols) && data.protocols.length > 0) {
              // Sanitize legacy auto-synced default papers if user never made active progress on them
              const isLegacyAutoSynced =
                data.protocols.length === 3 &&
                data.protocols.every((p: Protocol) =>
                  ['achilles', 'hair-loss', 'creatine-sleep'].includes(p.id)
                ) &&
                (!data.runtime ||
                  Object.keys(data.runtime).every((k) => {
                    const r = data.runtime[k];
                    return !r?.feedbackLogs?.length && !r?.morphingLogs?.length;
                  }));

              if (isLegacyAutoSynced) {
                // If local state is also empty or legacy, clean up remote record
                setProtocolList((currentLocal) => {
                  if (
                    currentLocal.length === 0 ||
                    currentLocal.every((p) => ['achilles', 'hair-loss', 'creatine-sleep'].includes(p.id))
                  ) {
                    fetch('/api/user/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId,
                        activeProtocolId: '',
                        protocols: [],
                        runtime: {}
                      })
                    }).catch(() => {});
                    setActiveProtocol('');
                    setRuntime({});
                    return [];
                  }
                  return currentLocal;
                });
              } else {
                setProtocolList((currentLocal) => {
                  const remoteList: Protocol[] = data.protocols;
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
                        activeProtocolId: data.activeProtocolId || merged[0]?.id || '',
                        protocols: merged,
                        runtime: { ...(data.runtime || {}), ...runtimeRef.current }
                      })
                    }).catch(() => {});
                    return merged;
                  }
                  return remoteList;
                });

                if (data.activeProtocolId) {
                  setActiveProtocol((curr) => curr || data.activeProtocolId);
                } else if (data.protocols[0]?.id) {
                  setActiveProtocol((curr) => curr || data.protocols[0].id);
                }

                if (data.runtime && typeof data.runtime === 'object') {
                  setRuntime((prev) => ({ ...data.runtime, ...prev }));
                }
              }
            } else {
              // Remote returned found=false or empty protocols list
              // DO NOT wipe local state! If the user already has routines locally, sync them to remote!
              setProtocolList((currentLocal) => {
                if (currentLocal.length > 0) {
                  fetch('/api/user/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId,
                      activeProtocolId: activeProtocolIdRef.current,
                      protocols: currentLocal,
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
        console.error('[useProtocolState] Cloud fetch error:', err);
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
          activeProtocolId,
          protocols: protocolList,
          runtime
        })
      }).catch((err) => {
        console.error('[useProtocolState] Cloud sync error:', err);
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [protocolList, activeProtocolId, runtime, hasHydrated, isAuthLoading, isAuthenticated, userId, hasRemoteHydrated]);

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
      window.localStorage.removeItem(keys.legacyProtocols);
      window.localStorage.removeItem(keys.legacyActiveId);
      window.localStorage.removeItem(keys.legacyRuntime);
    } catch (err) {
      console.error('[useRoutineState] Error clearing localStorage:', err);
    }

    setProtocolList([]);
    setActiveProtocol('');
    setQueuedPapers(initialQueuedPapers);
    setRuntime({});

    if (isAuthenticated && userId) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activeProtocolId: '',
          protocols: [],
          runtime: {}
        })
      }).catch(() => {});
    }

    toast.success(COPY.demo.resetSuccess);
  }, [isAuthenticated, userId, isAdmin]);

  const openHowTo = useCallback(() => setIsHowToOpen(true), []);
  const closeHowTo = useCallback(() => setIsHowToOpen(false), []);

  const loadSampleProtocol = useCallback(
    (sampleId: string) => {
      const sample =
        sampleProtocolsMap[sampleId] ||
        PRECALIBRATED_SAMPLE_PROTOCOLS[sampleId] ||
        sampleProtocols.find((p) => p.id === sampleId);
      if (!sample) {
        toast.error(`Sample protocol "${sampleId}" not found`);
        return;
      }

      // Ensure every new user or guest starts on Day 1 with clean history and 0 streak
      const cleanProtocol: Protocol = {
        ...sample,
        currentDay: 1,
        dayHistory: [],
        streak: 0,
        initialSetsDone: {},
        initialFeedbackLogs: [],
        initialMorphingLogs: []
      };

      const initialRuntimeEntry: ProtocolRuntime = {
        setsDone: {},
        excludedStepIds: cleanProtocol.initialExcludedStepIds ?? [],
        feedbackLogs: [],
        morphingLogs: [],
        messages: cleanProtocol.initialMessages?.length
          ? cleanProtocol.initialMessages
          : [
              {
                id: createId('msg'),
                role: 'ai',
                kind: 'routine',
                content: cleanProtocol.id,
                timestamp: nowLabel()
              }
            ],
        escalationPaused: false,
        assistantTyping: false
      };

      let updatedList: Protocol[] = [];
      setProtocolList((prev) => {
        const exists = prev.some((p) => p.id === cleanProtocol.id);
        updatedList = exists ? prev : [...prev, cleanProtocol];

        // Synchronous write to localStorage guarantees persistence even on immediate page refresh
        const keys = getStorageKeys(isAuthenticated ? userId : undefined);
        try {
          window.localStorage.setItem(keys.routines, JSON.stringify(updatedList));
          window.localStorage.setItem(keys.activeId, cleanProtocol.id);
        } catch {
          // Ignore write restrictions
        }

        return updatedList;
      });

      setActiveProtocol(cleanProtocol.id);

      let updatedRuntime: Record<string, ProtocolRuntime> = {};
      setRuntime((prev) => {
        updatedRuntime = prev[cleanProtocol.id]
          ? prev
          : { ...prev, [cleanProtocol.id]: initialRuntimeEntry };

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
            activeProtocolId: cleanProtocol.id,
            activeRoutineId: cleanProtocol.id,
            protocols: updatedList.length > 0 ? updatedList : [cleanProtocol],
            routines: updatedList.length > 0 ? updatedList : [cleanProtocol],
            runtime: Object.keys(updatedRuntime).length > 0 ? updatedRuntime : { [cleanProtocol.id]: initialRuntimeEntry }
          })
        }).catch((err) => {
          console.warn('[loadSampleProtocol] Cloud sync error:', err);
        });
      }

      setIsHowToOpen(false);
      toast.success(COPY.howTo.loadedToast(cleanProtocol.shortTitle || cleanProtocol.title));
    },
    [sampleProtocolsMap, isAuthenticated, userId]
  );

  const protocol = (protocolList.find((item) => item.id === activeProtocolId) ?? protocolList[0]) || null;
  const state: ProtocolRuntime = protocol && runtime[protocol.id]
    ? runtime[protocol.id]
    : {
        setsDone: {},
        feedbackLogs: [],
        morphingLogs: [],
        messages: [],
        escalationPaused: false,
        assistantTyping: false
      };

  const updateRuntime = useCallback((id: string, update: (prev: ProtocolRuntime) => ProtocolRuntime) => {
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

  const feedbackMetric = useMemo(
    () =>
      protocol
        ? resolveFeedbackMetric(protocol)
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
    [protocol]
  );
  const dataCollectionSpec = useMemo(
    () => (protocol ? resolveDataCollectionSpec(protocol) : []),
    [protocol]
  );
  const morphingLogs = useMemo(
    () => state.morphingLogs ?? protocol?.initialMorphingLogs ?? [],
    [state.morphingLogs, protocol?.initialMorphingLogs]
  );
  const isCurrentDayMilestone = useMemo(
    () => (protocol ? isMilestoneDay(protocol, protocol.currentDay) : false),
    [protocol]
  );
  const scheduledFields = useMemo(
    () => (protocol ? getScheduledFieldsForDay(protocol, protocol.currentDay) : []),
    [protocol]
  );

  const pushMessages = useCallback(
    (id: string, ...messages: NewChatMessage[]) => {
      if (!id) return;
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
      if (!protocol) return;
      updateRuntime(protocol.id, (prev) => {
        const current = prev.excludedStepIds ?? [];
        const isExcluded = current.includes(stepId);
        const next = isExcluded ? current.filter((id) => id !== stepId) : [...current, stepId];
        return { ...prev, excludedStepIds: next };
      });
    },
    [protocol, updateRuntime]
  );

  const isStepExcluded = useCallback(
    (stepId: string) => (state.excludedStepIds ?? []).includes(stepId),
    [state.excludedStepIds]
  );

  // Derived values
  const todayFraction = protocol
    ? completionOf(protocol, state.setsDone, state.excludedStepIds ?? [])
    : 0;
  const todayPercent = toPercent(todayFraction);
  const activeSteps = useMemo(
    () => (protocol ? protocol.steps.filter((s) => !(state.excludedStepIds ?? []).includes(s.id)) : []),
    [protocol, state.excludedStepIds]
  );
  const dayIsComplete = protocol && activeSteps.length > 0 ? todayFraction === 1 : false;
  const adherenceRate = protocol ? adherenceOf(protocol, todayFraction) : 0;
  const progressionReady = protocol
    ? isProgressionReady(
        state.feedbackLogs,
        state.escalationPaused,
        feedbackMetric.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD
      )
    : false;

  const summaries = useMemo<ProtocolSummary[]>(
    () =>
      protocolList.map((item) => {
        const itemState = runtime[item.id]?.setsDone ?? {};
        const itemExcluded = runtime[item.id]?.excludedStepIds ?? [];
        const fraction = completionOf(item, itemState, itemExcluded);
        return {
          id: item.id,
          title: item.title,
          shortTitle: item.shortTitle,
          icon: item.icon,
          currentDay: item.currentDay,
          totalDays: item.totalDays,
          streak: item.streak,
          todayFraction: fraction,
          todayPercent: toPercent(fraction)
        };
      }),
    [protocolList, runtime]
  );

  const findStep = useCallback(
    (stepId: string) => (protocol ? protocol.steps.find((step) => step.id === stepId) : undefined),
    [protocol]
  );

  const isStepComplete = useCallback(
    (stepId: string) => {
      if (!protocol) return false;
      if ((state.excludedStepIds ?? []).includes(stepId)) return false;
      const step = protocol.steps.find((s) => s.id === stepId);
      return step ? (state.setsDone[stepId] ?? 0) >= step.sets : false;
    },
    [protocol, state.setsDone, state.excludedStepIds]
  );

  const updateSetCount = useCallback(
    (stepId: string, next: (current: number, max: number) => number) => {
      if (!protocol) return;
      const step = protocol.steps.find((s) => s.id === stepId);
      if (!step) return;
      updateRuntime(protocol.id, (prev) => ({
        ...prev,
        setsDone: {
          ...prev.setsDone,
          [stepId]: clamp(next(prev.setsDone[stepId] ?? 0, step.sets), 0, step.sets)
        }
      }));
    },
    [protocol, updateRuntime]
  );

  const incrementSet = useCallback((stepId: string) => updateSetCount(stepId, (current) => current + 1), [updateSetCount]);
  const decrementSet = useCallback((stepId: string) => updateSetCount(stepId, (current) => current - 1), [updateSetCount]);
  const toggleStep = useCallback(
    (stepId: string) => updateSetCount(stepId, (current, max) => (current >= max ? 0 : max)),
    [updateSetCount]
  );

  const markTodayComplete = useCallback(() => {
    if (!protocol) return;
    const nonExcludedSteps = protocol.steps.filter(
      (step) => !(state.excludedStepIds ?? []).includes(step.id)
    );
    const allSetsDone = Object.fromEntries(nonExcludedSteps.map((step) => [step.id, step.sets]));
    updateRuntime(protocol.id, (prev) => ({
      ...prev,
      setsDone: { ...prev.setsDone, ...allSetsDone }
    }));
    const latestScore = state.feedbackLogs[state.feedbackLogs.length - 1]?.score ?? DEFAULT_CONFIRMATION_SCORE;
    pushMessages(protocol.id, {
      role: 'ai',
      kind: 'confirmation',
      content: COPY.assistant.confirmLogged(protocol.currentDay, latestScore)
    });
  }, [protocol, state.excludedStepIds, state.feedbackLogs, updateRuntime, pushMessages]);

  const logFeedback = useCallback(
    (score: number, note: string) => {
      if (!protocol) return;
      const metric = resolveFeedbackMetric(protocol);
      const threshold = metric.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD;
      const exceeded = exceedsFeedbackThreshold(score, threshold);
      const newLog = { id: createId('log'), day: protocol.currentDay, score, note, loggedAt: nowLabel() };
      updateRuntime(protocol.id, (prev) => {
        const existing = prev.feedbackLogs ?? [];
        const next = [...existing, newLog];
        return {
          ...prev,
          escalationPaused: prev.escalationPaused || exceeded,
          feedbackLogs: next
        };
      });
      pushMessages(
        protocol.id,
        exceeded
          ? {
              role: 'ai',
              kind: 'alert',
              content: COPY.safety.dynamicEscalationAlert(metric.name, metric.escalationMessage)
            }
          : { role: 'ai', kind: 'confirmation', content: COPY.assistant.confirmSafe(protocol.currentDay, score) }
      );
    },
    [protocol, updateRuntime, pushMessages]
  );

  const logMorphingData = useCallback(
    (fieldId: string, value: number | string | boolean, note = '') => {
      if (!protocol) return;
      const spec = resolveDataCollectionSpec(protocol);
      const field = spec.find((f) => f.id === fieldId) ?? spec[0];
      if (!field) return;
      const threshold = field.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD;
      const isNumeric = typeof value === 'number';
      const exceeded = isNumeric && exceedsFeedbackThreshold(value, threshold);

      const newMorphLog: MorphingDataLog = {
        id: createId('morph'),
        fieldId,
        day: protocol.currentDay,
        value,
        note,
        loggedAt: nowLabel()
      };

      updateRuntime(protocol.id, (prev) => {
        const existingMorph = prev.morphingLogs ?? [];
        const nextMorph = [...existingMorph, newMorphLog];

        let nextFeedback = prev.feedbackLogs ?? [];
        if (field.type === 'scale' && isNumeric) {
          nextFeedback = [
            ...nextFeedback,
            { id: createId('log'), day: protocol.currentDay, score: value, note, loggedAt: nowLabel() }
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
        protocol.id,
        exceeded
          ? {
              role: 'ai',
              kind: 'alert',
              content: COPY.safety.dynamicEscalationAlert(field.name, field.escalationMessage)
            }
          : {
              role: 'ai',
              kind: 'confirmation',
              content: COPY.morphing.values.fieldConfirmation(field.name, protocol.currentDay, displayVal)
            }
      );
    },
    [protocol, updateRuntime, pushMessages]
  );

  const askQuestion = useCallback(
    async (text: string) => {
      if (!protocol) {
        toast.info(COPY.errors.noProtocolsBody);
        return;
      }
      const target = protocol;
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
        console.info('[useProtocolState] Edge Gemma bypassed, routing to API:', edgeErr);
      }

      // Tier 2: Cloud Gemini / Server Gemma Route Handler
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text,
            protocolTitle: target.title,
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
    [protocol, pushMessages, updateRuntime]
  );

  const askAboutStep = useCallback(
    (step: RoutineStep | ProtocolStep) => {
      askQuestion(COPY.task.taskQuestionPrompt(step.action));
    },
    [askQuestion]
  );

  const addProtocol = useCallback((newProtocol: Protocol) => {
    let updatedList: Protocol[] = [];
    setProtocolList((prev) => {
      const exists = prev.some((p) => p.id === newProtocol.id);
      updatedList = exists ? prev.map((p) => (p.id === newProtocol.id ? newProtocol : p)) : [...prev, newProtocol];

      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      try {
        window.localStorage.setItem(keys.routines, JSON.stringify(updatedList));
        window.localStorage.setItem(keys.activeId, newProtocol.id);
      } catch {
        // Ignore
      }

      return updatedList;
    });

    const newRuntimeEntry: ProtocolRuntime = {
      setsDone: { ...(newProtocol.initialSetsDone ?? {}) },
      excludedStepIds: newProtocol.initialExcludedStepIds ?? [],
      feedbackLogs: newProtocol.initialFeedbackLogs ?? [],
      messages: newProtocol.initialMessages ?? [],
      escalationPaused: false,
      assistantTyping: false
    };

    let updatedRuntime: Record<string, ProtocolRuntime> = {};
    setRuntime((prev) => {
      updatedRuntime = { ...prev, [newProtocol.id]: newRuntimeEntry };
      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      try {
        window.localStorage.setItem(keys.runtime, JSON.stringify(updatedRuntime));
      } catch {
        // Ignore
      }
      return updatedRuntime;
    });

    setActiveProtocol(newProtocol.id);

    if (isAuthenticated && userId) {
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          activeProtocolId: newProtocol.id,
          activeRoutineId: newProtocol.id,
          protocols: updatedList.length > 0 ? updatedList : [newProtocol],
          routines: updatedList.length > 0 ? updatedList : [newProtocol],
          runtime: Object.keys(updatedRuntime).length > 0 ? updatedRuntime : { [newProtocol.id]: newRuntimeEntry }
        })
      }).catch((err) => {
        console.warn('[addProtocol] Cloud sync error:', err);
      });
    }
  }, [isAuthenticated, userId]);

  const addRoutine = addProtocol;

  const uploadPaper = useCallback(
    async (source: string | File, extractedProtocol?: Protocol) => {
      if (extractedProtocol) {
        setStagingProtocol(extractedProtocol);
        setStagingError(null);
        setStagingMessages([
          {
            id: createId('msg'),
            role: 'user',
            kind: 'file',
            content: extractedProtocol.paper?.title || extractedProtocol.title,
            timestamp: nowLabel()
          },
          {
            id: createId('msg'),
            role: 'ai',
            kind: 'candidate',
            content: extractedProtocol.id,
            timestamp: nowLabel()
          }
        ]);
        return;
      }

      const fileName = typeof source === 'string' ? source : source.name;
      setStagingProtocol(null);
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
        const extractedRoutine = result.routine || result.protocol;

        if (result.eligible && extractedRoutine) {
          setStagingProtocol(extractedRoutine);
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
      } finally {
        setIsExtractingPaper(false);
      }
    },
    []
  );

  const confirmStagingProtocol = useCallback(() => {
    if (!stagingProtocol) return;
    const target = stagingProtocol;
    addProtocol(target);

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
          protocolId: target.id,
          isSample: false,
          userId: userId || 'guest'
        },
        routine: target,
        protocol: target
      })
    }).catch((err) => {
      console.warn('[confirmStagingProtocol] Could not persist to Firebase papers collection:', err);
    });

    const displayTitle = target.shortTitle || target.title;
    setStagingProtocol(null);
    setStagingMessages([]);
    setStagingError(null);
    toast.success(COPY.assistant.confirmedToast(displayTitle));
  }, [stagingProtocol, addProtocol, userId]);

  const discardStagingProtocol = useCallback(() => {
    setStagingProtocol(null);
    setStagingMessages([]);
    setStagingError(null);
    setIsExtractingPaper(false);
    toast.info(COPY.assistant.discardedToast);
  }, []);

  const askStagingQuestion = useCallback(
    async (text: string) => {
      if (!stagingProtocol) return;
      const target = stagingProtocol;
      const userMsg: ChatMessage = {
        id: createId('msg'),
        role: 'user',
        kind: 'question',
        content: text,
        timestamp: nowLabel()
      };
      setStagingMessages((prev) => [...prev, userMsg]);
      setIsStagingAssistantTyping(true);

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
            protocolTitle: target.title,
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
    [stagingProtocol]
  );

  const toggleStagingExcludeStep = useCallback((stepId: string) => {
    setStagingProtocol((prev) => {
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
    }) => {
      if (!protocol) return;

      const payload = {
        protocolId: protocol.id,
        outcome: reviewData.outcome,
        text: reviewData.text,
        handle: reviewData.handle,
        day: reviewData.day ?? protocol.currentDay,
        adherence: reviewData.adherence ?? adherenceRate,
        userId: userId || undefined
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
          setProtocolList((prev) =>
            prev.map((p) => {
              if (p.id !== protocol.id) return p;
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
    [protocol, adherenceRate, userId, closeReviewDrawer]
  );

  const updateGuardrailThreshold = useCallback(
    (threshold: number, message?: string) => {
      if (!protocol) return;
      setProtocolList((prev) =>
        prev.map((p) => {
          if (p.id !== protocol.id) return p;
          const updatedFeedbackMetric = p.feedbackMetric
            ? {
                ...p.feedbackMetric,
                escalationThreshold: threshold,
                escalationMessage: message || p.feedbackMetric.escalationMessage
              }
            : p.feedbackMetric;

          const updatedSpec = (p.dataCollectionSpec || []).map((field) => {
            if (field.type === 'scale' || field.escalationThreshold !== undefined) {
              return {
                ...field,
                escalationThreshold: threshold,
                escalationMessage: message || field.escalationMessage
              };
            }
            return field;
          });

          return {
            ...p,
            feedbackMetric: updatedFeedbackMetric,
            dataCollectionSpec: updatedSpec
          };
        })
      );
    },
    [protocol]
  );

  return useMemo(
    () => ({
      routines: summaries,
      protocols: summaries,
      queuedPapers,
      activeRoutineId: protocol?.id ?? '',
      activeProtocolId: protocol?.id ?? '',
      setActiveRoutine: setActiveProtocol,
      setActiveProtocol,
      routine: protocol,
      protocol,
      hasRoutines: protocolList.length > 0,
      hasProtocols: protocolList.length > 0,
      currentDay: protocol?.currentDay ?? 1,
      totalDays: protocol?.totalDays ?? 14,
      streak: protocol?.streak ?? 0,
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
      dayIsComplete,
      progressionReady,
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
      loadTrendingRoutine: loadSampleProtocol,
      loadSampleRoutine: loadSampleProtocol,
      loadSampleProtocol,
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
      logFeedback,
      logMorphingData,
      askQuestion,
      askAboutStep,
      uploadPaper,
      stagingProtocol,
      isExtractingPaper,
      extractingSourceName,
      stagingMessages,
      stagingError,
      isStagingAssistantTyping,
      confirmStagingProtocol,
      discardStagingProtocol,
      askStagingQuestion,
      toggleStagingExcludeStep,
      addRoutine: addProtocol,
      addProtocol,
      resetToDefaults,
      updateGuardrailThreshold,
      hasHydrated
    }),
    [
      summaries,
      queuedPapers,
      protocol,
      protocolList.length,
      state.messages,
      state.setsDone,
      state.feedbackLogs,
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
      dayIsComplete,
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
      loadSampleProtocol,
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
      logFeedback,
      logMorphingData,
      askQuestion,
      askAboutStep,
      uploadPaper,
      stagingProtocol,
      isExtractingPaper,
      extractingSourceName,
      stagingMessages,
      stagingError,
      isStagingAssistantTyping,
      confirmStagingProtocol,
      discardStagingProtocol,
      askStagingQuestion,
      toggleStagingExcludeStep,
      addProtocol,
      resetToDefaults,
      updateGuardrailThreshold,
      hasHydrated
    ]
  );
}

export type RoutineState = ReturnType<typeof useRoutineState>;
export type ProtocolState = RoutineState;
export const useProtocolState = useRoutineState;