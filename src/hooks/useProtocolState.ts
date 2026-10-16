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
  QueuedPaper
} from '../types/protocol';
import { answerFor } from '../utils/assistant';
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
} from '../utils/protocolMetrics';
import { nowLabel } from '../utils/time';

function createInitialRuntime(items: Protocol[]): Record<string, ProtocolRuntime> {
  return Object.fromEntries(
    items.map((item) => {
      const logs = item.initialFeedbackLogs ?? [];
      const morphLogs = item.initialMorphingLogs ?? [];
      return [
        item.id,
        {
          setsDone: { ...item.initialSetsDone },
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
const STORAGE_KEY_PREFIX = `protocol_engine_${STORAGE_VERSION}`;

function getStorageKeys(userId?: string) {
  const scope = userId ? `usr_${userId}` : 'guest';
  return {
    protocols: `${STORAGE_KEY_PREFIX}_${scope}_protocols`,
    activeId: `${STORAGE_KEY_PREFIX}_${scope}_active_id`,
    runtime: `${STORAGE_KEY_PREFIX}_${scope}_runtime`
  };
}

/** All protocol session state + actions. Only raw state is stored; metrics are derived on render. */
export function useProtocolState() {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated;
  const userId = auth?.user?.id;

  const [protocolList, setProtocolList] = useState<Protocol[]>(initialProtocols);
  const [activeProtocolId, setActiveProtocol] = useState<string>(initialProtocols[0]?.id ?? '');
  const [queuedPapers, setQueuedPapers] = useState<QueuedPaper[]>(initialQueuedPapers);
  const [isFeedbackDrawerOpen, setIsFeedbackDrawerOpen] = useState(false);
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<Record<string, ProtocolRuntime>>(() => createInitialRuntime(initialProtocols));
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRemoteHydrated, setHasRemoteHydrated] = useState(false);

  // Dynamic sample research papers pulled from Firebase Firestore
  const [samplePapers, setSamplePapers] = useState<SamplePaper[]>(SAMPLE_PAPERS);
  const [sampleProtocolsMap, setSampleProtocolsMap] = useState<Record<string, Protocol>>(PRECALIBRATED_SAMPLE_PROTOCOLS);
  const [sampleSource, setSampleSource] = useState<'firestore-live' | 'memory-cache'>('memory-cache');

  // Pull sample papers from Firebase Firestore on startup
  useEffect(() => {
    let isMounted = true;
    async function fetchFirebaseSamplePapers() {
      try {
        const res = await fetch('/api/papers?type=samples');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (Array.isArray(data.samplePapers) && data.samplePapers.length > 0) {
              setSamplePapers(data.samplePapers);
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
        console.warn('[useProtocolState] Could not fetch sample papers from Firebase, using baseline:', err);
      }
    }

    fetchFirebaseSamplePapers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Safe client hydration from scoped localStorage and legacy cleanup
  useEffect(() => {
    let isMounted = true;
    try {
      // Clean up legacy v1 storage keys that may contain old default pre-seeded papers
      window.localStorage.removeItem('protocol_engine_protocols_v1');
      window.localStorage.removeItem('protocol_engine_active_id_v1');
      window.localStorage.removeItem('protocol_engine_runtime_v1');

      const keys = getStorageKeys(isAuthenticated ? userId : undefined);
      const savedProtocolsRaw = window.localStorage.getItem(keys.protocols);
      const savedActiveId = window.localStorage.getItem(keys.activeId);
      const savedRuntimeRaw = window.localStorage.getItem(keys.runtime);

      let loadedProtocols: Protocol[] = [];
      if (savedProtocolsRaw) {
        try {
          const parsed = JSON.parse(savedProtocolsRaw);
          if (Array.isArray(parsed)) {
            loadedProtocols = parsed;
            if (isMounted) {
              setProtocolList(loadedProtocols);
            }
          }
        } catch (err) {
          console.error('[useProtocolState] Failed parsing scoped protocols:', err);
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
            if (isMounted) {
              setRuntime(parsedRuntime);
            }
          }
        } catch (err) {
          console.error('[useProtocolState] Failed parsing scoped runtime:', err);
        }
      } else {
        if (isMounted) {
          setRuntime({});
        }
      }
    } catch (err) {
      console.error('[useProtocolState] Hydration error:', err);
    } finally {
      if (isMounted) {
        setHasHydrated(true);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, userId]);

  // Persist changes to scoped localStorage once hydrated
  useEffect(() => {
    if (!hasHydrated) return;
    const keys = getStorageKeys(isAuthenticated ? userId : undefined);
    try {
      window.localStorage.setItem(keys.protocols, JSON.stringify(protocolList));
      window.localStorage.setItem(keys.activeId, activeProtocolId);
      window.localStorage.setItem(keys.runtime, JSON.stringify(runtime));
    } catch (err) {
      console.error('[useProtocolState] LocalStorage write error:', err);
    }
  }, [protocolList, activeProtocolId, runtime, hasHydrated, isAuthenticated, userId]);

  // Fetch cloud state when authenticating as a signed-in user
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated || !userId) {
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
                // Start with a clean onboarding slate and clean up remote record
                setProtocolList([]);
                setActiveProtocol('');
                setRuntime({});
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
              } else {
                setProtocolList(data.protocols);
                if (data.activeProtocolId) {
                  setActiveProtocol(data.activeProtocolId);
                } else {
                  setActiveProtocol(data.protocols[0]?.id ?? '');
                }
                if (data.runtime && typeof data.runtime === 'object') {
                  setRuntime(data.runtime);
                }
              }
            } else {
              // Brand new user: clean slate with 0 papers pre-selected
              setProtocolList([]);
              setActiveProtocol('');
              setRuntime({});
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
  }, [isAuthenticated, userId]);

  // Outbound sync to backend once remote state is confirmed/hydrated
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !userId || !hasRemoteHydrated) return;

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
  }, [protocolList, activeProtocolId, runtime, hasHydrated, isAuthenticated, userId, hasRemoteHydrated]);

  const resetToDefaults = useCallback(() => {
    const keys = getStorageKeys(isAuthenticated ? userId : undefined);
    try {
      window.localStorage.removeItem(keys.protocols);
      window.localStorage.removeItem(keys.activeId);
      window.localStorage.removeItem(keys.runtime);
    } catch (err) {
      console.error('[useProtocolState] Error clearing localStorage:', err);
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
  }, [isAuthenticated, userId]);

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

      setProtocolList((prev) => {
        const exists = prev.some((p) => p.id === sample.id);
        if (exists) return prev;
        return [...prev, sample];
      });

      setActiveProtocol(sample.id);

      setRuntime((prev) => {
        if (prev[sample.id]) return prev;
        return {
          ...prev,
          [sample.id]: {
            setsDone: { ...(sample.initialSetsDone ?? {}) },
            feedbackLogs: sample.initialFeedbackLogs ?? [],
            morphingLogs: sample.initialMorphingLogs ?? [],
            messages: sample.initialMessages ?? [],
            escalationPaused: false,
            assistantTyping: false
          }
        };
      });

      setIsHowToOpen(false);
      toast.success(COPY.howTo.loadedToast(sample.shortTitle || sample.title));
    },
    [sampleProtocolsMap]
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

  // Derived values
  const todayFraction = protocol ? completionOf(protocol, state.setsDone) : 0;
  const todayPercent = toPercent(todayFraction);
  const dayIsComplete = protocol ? todayFraction === 1 : false;
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
        const fraction = completionOf(item, itemState);
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
      const step = protocol.steps.find((s) => s.id === stepId);
      return step ? (state.setsDone[stepId] ?? 0) >= step.sets : false;
    },
    [protocol, state.setsDone]
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
    const allSetsDone = Object.fromEntries(protocol.steps.map((step) => [step.id, step.sets]));
    updateRuntime(protocol.id, (prev) => ({ ...prev, setsDone: allSetsDone }));
    const latestScore = state.feedbackLogs[state.feedbackLogs.length - 1]?.score ?? DEFAULT_CONFIRMATION_SCORE;
    pushMessages(protocol.id, {
      role: 'ai',
      kind: 'confirmation',
      content: COPY.assistant.confirmLogged(protocol.currentDay, latestScore)
    });
  }, [protocol, state.feedbackLogs, updateRuntime, pushMessages]);

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
            paper: target.paper
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.answer) {
            pushMessages(target.id, {
              role: 'ai',
              kind: 'answer',
              content: data.answer,
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
          content: answerFor(target, text),
          engine: 'local-rules',
          source: COPY.assistant.methodsSectionSource
        });
      } catch {
        pushMessages(target.id, {
          role: 'ai',
          kind: 'answer',
          content: answerFor(target, text),
          engine: 'local-rules',
          source: COPY.assistant.methodsSectionSource
        });
      } finally {
        updateRuntime(target.id, (prev) => ({ ...prev, assistantTyping: false }));
      }
    },
    [protocol, pushMessages, updateRuntime]
  );

  const addProtocol = useCallback((newProtocol: Protocol) => {
    setProtocolList((prev) => {
      const exists = prev.some((p) => p.id === newProtocol.id);
      return exists ? prev.map((p) => (p.id === newProtocol.id ? newProtocol : p)) : [...prev, newProtocol];
    });
    setRuntime((prev) => {
      const logs = newProtocol.initialFeedbackLogs ?? [];
      return {
        ...prev,
        [newProtocol.id]: {
          setsDone: { ...(newProtocol.initialSetsDone ?? {}) },
          feedbackLogs: logs,
          messages: newProtocol.initialMessages ?? [],
          escalationPaused: false,
          assistantTyping: false
        }
      };
    });
    setActiveProtocol(newProtocol.id);
  }, []);

  const uploadPaper = useCallback(
    async (source: string | File, extractedProtocol?: Protocol) => {
      if (extractedProtocol) {
        addProtocol(extractedProtocol);
        return;
      }

      const fileName = typeof source === 'string' ? source : source.name;
      const queuedId = createId('queued');
      const procId = createId('proc');
      const targetProtocolId = protocol?.id ?? 'pending-upload';

      setQueuedPapers((prev) => [...prev, { id: queuedId, name: fileName, note: COPY.papers.queuedNote }]);
      pushMessages(
        targetProtocolId,
        { role: 'user', kind: 'file', content: fileName },
        { id: procId, role: 'ai', kind: 'processing', content: fileName, createdAt: Date.now() }
      );

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

        if (result.eligible && result.protocol) {
          addProtocol(result.protocol);

          // Persist uploaded paper to unified Firebase papers collection
          fetch('/api/papers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paper: {
                id: result.protocol.id,
                title: result.protocol.paper?.title || result.protocol.title,
                shortTitle: result.protocol.shortTitle,
                domain: result.protocol.phase || 'Clinical Research',
                category: 'rehab',
                authors: result.protocol.paper?.authors || 'Unknown Authors',
                journal: result.protocol.paper?.journal || 'Clinical Trial',
                year: result.protocol.paper?.year || new Date().getFullYear(),
                doi: result.protocol.paper?.doi || '',
                openAccessUrl: result.protocol.paper?.doi ? `https://doi.org/${result.protocol.paper?.doi}` : '',
                pdfUrl: typeof source === 'string' ? source : '',
                summary: result.protocol.steps?.map((s: ProtocolStep) => s.action).join('. ') || '',
                featuresTested: result.protocol.steps?.map((s: ProtocolStep) => s.action) || [],
                protocolId: result.protocol.id,
                isSample: false,
                userId: userId || 'guest'
              },
              protocol: result.protocol
            })
          }).catch((err) => {
            console.warn('[uploadPaper] Could not persist to Firebase papers collection:', err);
          });

          setQueuedPapers((prev) => prev.filter((p) => p.id !== queuedId));
          updateRuntime(targetProtocolId, (prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === procId
                ? { ...m, kind: 'confirmation', content: COPY.extraction.protocolReady(result.protocol.title) }
                : m
            )
          }));
          toast.success(COPY.extraction.success);
        } else {
          const reason = result.rejectionReason || COPY.extraction.declinedNonHuman;
          setQueuedPapers((prev) => prev.filter((p) => p.id !== queuedId));
          updateRuntime(targetProtocolId, (prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === procId
                ? { ...m, kind: 'alert', content: reason }
                : m
            )
          }));
          toast.error(reason);
        }
      } catch (err) {
        console.error('[uploadPaper] Extraction failed:', err);
        setQueuedPapers((prev) => prev.filter((p) => p.id !== queuedId));
        updateRuntime(targetProtocolId, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === procId
              ? { ...m, kind: 'alert', content: COPY.extraction.errorGeneral }
              : m
          )
        }));
        toast.error(COPY.extraction.errorGeneral);
      }
    },
    [protocol?.id, addProtocol, pushMessages, updateRuntime, userId]
  );

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
      protocols: summaries,
      queuedPapers,
      activeProtocolId: protocol?.id ?? '',
      setActiveProtocol,
      protocol,
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
      isHowToOpen,
      openHowTo,
      closeHowTo,
      loadSampleProtocol,
      samplePapers,
      sampleSource,
      isStepComplete,
      incrementSet,
      decrementSet,
      toggleStep,
      markTodayComplete,
      logFeedback,
      logMorphingData,
      askQuestion,
      uploadPaper,
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
      isHowToOpen,
      openHowTo,
      closeHowTo,
      loadSampleProtocol,
      samplePapers,
      sampleSource,
      isStepComplete,
      incrementSet,
      decrementSet,
      toggleStep,
      markTodayComplete,
      logFeedback,
      logMorphingData,
      askQuestion,
      uploadPaper,
      addProtocol,
      resetToDefaults,
      updateGuardrailThreshold,
      hasHydrated
    ]
  );
}

export type ProtocolState = ReturnType<typeof useProtocolState>;