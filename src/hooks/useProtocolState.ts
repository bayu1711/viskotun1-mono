import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '../contexts/AuthContext';
import { DEFAULT_CONFIRMATION_SCORE, FEEDBACK_ESCALATION_THRESHOLD } from '../data/config';
import { COPY } from '../data/copy';
import { initialQueuedPapers, protocols as initialProtocols } from '../data/protocols';
import type {
  ChatMessage,
  NewChatMessage,
  Protocol,
  ProtocolRuntime,
  ProtocolSummary,
  QueuedPaper
} from '../types/protocol';
import { answerFor } from '../utils/assistant';
import { createId } from '../utils/id';
import { clamp, toPercent } from '../utils/math';
import {
  adherenceOf,
  completionOf,
  exceedsFeedbackThreshold,
  isProgressionReady,
  resolveFeedbackMetric
} from '../utils/protocolMetrics';
import { nowLabel } from '../utils/time';

function createInitialRuntime(items: Protocol[]): Record<string, ProtocolRuntime> {
  return Object.fromEntries(
    items.map((item) => {
      const logs = item.initialFeedbackLogs ?? [];
      return [
        item.id,
        {
          setsDone: { ...item.initialSetsDone },
          feedbackLogs: logs,
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

const STORAGE_KEY_PROTOCOLS = 'protocol_engine_protocols_v1';
const STORAGE_KEY_ACTIVE_ID = 'protocol_engine_active_id_v1';
const STORAGE_KEY_RUNTIME = 'protocol_engine_runtime_v1';

/** All protocol session state + actions. Only raw state is stored; metrics are derived on render. */
export function useProtocolState() {
  const auth = useContext(AuthContext);
  const [protocolList, setProtocolList] = useState<Protocol[]>(initialProtocols);
  const [activeProtocolId, setActiveProtocol] = useState(initialProtocols[0].id);
  const [queuedPapers, setQueuedPapers] = useState<QueuedPaper[]>(initialQueuedPapers);
  const [isFeedbackDrawerOpen, setIsFeedbackDrawerOpen] = useState(false);
  const [runtime, setRuntime] = useState(() => createInitialRuntime(initialProtocols));
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRemoteHydrated, setHasRemoteHydrated] = useState(false);

  // Safe client hydration from localStorage
  useEffect(() => {
    let isMounted = true;
    try {
      const savedActiveId = window.localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      const savedProtocolsRaw = window.localStorage.getItem(STORAGE_KEY_PROTOCOLS);
      const savedRuntimeRaw = window.localStorage.getItem(STORAGE_KEY_RUNTIME);

      let loadedProtocols = initialProtocols;
      if (savedProtocolsRaw) {
        try {
          const parsed: Protocol[] = JSON.parse(savedProtocolsRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const defaultIds = new Set(initialProtocols.map((p) => p.id));
            const customOnes = parsed.filter((p) => !defaultIds.has(p.id));
            loadedProtocols = [...initialProtocols, ...customOnes];
            if (isMounted) {
              setProtocolList(loadedProtocols);
            }
          }
        } catch (err) {
          console.error('[useProtocolState] Failed parsing saved protocols:', err);
        }
      }

      if (savedActiveId && loadedProtocols.some((p) => p.id === savedActiveId)) {
        if (isMounted) {
          setActiveProtocol(savedActiveId);
        }
      }

      if (savedRuntimeRaw) {
        try {
          const parsedRuntime = JSON.parse(savedRuntimeRaw);
          if (parsedRuntime && typeof parsedRuntime === 'object') {
            if (isMounted) {
              setRuntime((prev) => {
                const merged = { ...prev };
                for (const [key, val] of Object.entries(parsedRuntime)) {
                  if (val && typeof val === 'object') {
                    merged[key] = {
                      ...(prev[key] ?? {
                        setsDone: {},
                        feedbackLogs: [],
                        messages: [],
                        escalationPaused: false,
                        assistantTyping: false
                      }),
                      ...(val as ProtocolRuntime),
                      feedbackLogs: (val as ProtocolRuntime).feedbackLogs ?? [],
                      assistantTyping: false
                    };
                  }
                }
                return merged;
              });
            }
          }
        } catch (err) {
          console.error('[useProtocolState] Failed parsing saved runtime:', err);
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
  }, []);

  // Persist changes to localStorage once hydrated
  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY_PROTOCOLS, JSON.stringify(protocolList));
      window.localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeProtocolId);
      window.localStorage.setItem(STORAGE_KEY_RUNTIME, JSON.stringify(runtime));
    } catch (err) {
      console.error('[useProtocolState] LocalStorage write error:', err);
    }
  }, [protocolList, activeProtocolId, runtime, hasHydrated]);

  // Sync to backend for authenticated users
  const isAuthenticated = auth?.isAuthenticated;
  const userId = auth?.user?.id;

  // Fetch cloud state on initial authentication
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
          if (isMounted && data.found) {
            if (Array.isArray(data.protocols) && data.protocols.length > 0) {
              setProtocolList(data.protocols);
            }
            if (data.activeProtocolId) {
              setActiveProtocol(data.activeProtocolId);
            }
            if (data.runtime && typeof data.runtime === 'object') {
              setRuntime((prev) => ({ ...prev, ...data.runtime }));
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
    try {
      window.localStorage.removeItem(STORAGE_KEY_PROTOCOLS);
      window.localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      window.localStorage.removeItem(STORAGE_KEY_RUNTIME);
    } catch (err) {
      console.error('[useProtocolState] Error clearing localStorage:', err);
    }

    setProtocolList(initialProtocols);
    setActiveProtocol(initialProtocols[0].id);
    setQueuedPapers(initialQueuedPapers);
    setRuntime(createInitialRuntime(initialProtocols));
    toast.success(COPY.demo.resetSuccess);
  }, []);

  const protocol = protocolList.find((item) => item.id === activeProtocolId) ?? protocolList[0];
  const state = runtime[protocol.id] ?? {
    setsDone: {},
    feedbackLogs: [],
    messages: [],
    escalationPaused: false,
    assistantTyping: false
  };

  const updateRuntime = useCallback((id: string, update: (prev: ProtocolRuntime) => ProtocolRuntime) => {
    setRuntime((prev) => {
      const current = prev[id] ?? {
        setsDone: {},
        feedbackLogs: [],
        messages: [],
        escalationPaused: false,
        assistantTyping: false
      };
      return { ...prev, [id]: update(current) };
    });
  }, []);

  const pushMessages = useCallback(
    (id: string, ...messages: NewChatMessage[]) => {
      updateRuntime(id, (prev) => ({
        ...prev,
        messages: [...prev.messages, ...messages.map(buildMessage)]
      }));
    },
    [updateRuntime]
  );

  // Derived values
  const todayFraction = completionOf(protocol, state.setsDone);
  const todayPercent = toPercent(todayFraction);
  const dayIsComplete = todayFraction === 1;
  const adherenceRate = adherenceOf(protocol, todayFraction);
  const feedbackMetric = resolveFeedbackMetric(protocol);
  const progressionReady = isProgressionReady(
    state.feedbackLogs,
    state.escalationPaused,
    feedbackMetric.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD
  );

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
    (stepId: string) => protocol.steps.find((step) => step.id === stepId),
    [protocol.steps]
  );

  const isStepComplete = useCallback(
    (stepId: string) => {
      const step = protocol.steps.find((s) => s.id === stepId);
      return step ? (state.setsDone[stepId] ?? 0) >= step.sets : false;
    },
    [protocol.steps, state.setsDone]
  );

  const updateSetCount = useCallback(
    (stepId: string, next: (current: number, max: number) => number) => {
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
    [protocol.id, protocol.steps, updateRuntime]
  );

  const incrementSet = useCallback((stepId: string) => updateSetCount(stepId, (current) => current + 1), [updateSetCount]);
  const decrementSet = useCallback((stepId: string) => updateSetCount(stepId, (current) => current - 1), [updateSetCount]);
  const toggleStep = useCallback(
    (stepId: string) => updateSetCount(stepId, (current, max) => (current >= max ? 0 : max)),
    [updateSetCount]
  );

  const markTodayComplete = useCallback(() => {
    const allSetsDone = Object.fromEntries(protocol.steps.map((step) => [step.id, step.sets]));
    updateRuntime(protocol.id, (prev) => ({ ...prev, setsDone: allSetsDone }));
    const latestScore = state.feedbackLogs[state.feedbackLogs.length - 1]?.score ?? DEFAULT_CONFIRMATION_SCORE;
    pushMessages(protocol.id, {
      role: 'ai',
      kind: 'confirmation',
      content: COPY.assistant.confirmLogged(protocol.currentDay, latestScore)
    });
  }, [protocol.steps, protocol.id, protocol.currentDay, state.feedbackLogs, updateRuntime, pushMessages]);

  const logFeedback = useCallback(
    (score: number, note: string) => {
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

  const askQuestion = useCallback(
    async (text: string) => {
      const target = protocol;
      pushMessages(target.id, { role: 'user', kind: 'question', content: text });
      updateRuntime(target.id, (prev) => ({ ...prev, assistantTyping: true }));

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: text,
            protocolTitle: target.title,
            faqs: target.faqs,
            contraindications: target.contraindications,
            steps: target.steps
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.answer) {
            pushMessages(target.id, { role: 'ai', kind: 'answer', content: data.answer });
            return;
          }
        }
        pushMessages(target.id, { role: 'ai', kind: 'answer', content: answerFor(target, text) });
      } catch {
        pushMessages(target.id, { role: 'ai', kind: 'answer', content: answerFor(target, text) });
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
      const targetProtocolId = protocol.id;

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
          throw new Error(`Extraction failed with HTTP ${res.status}`);
        }

        const result = await res.json();

        if (result.eligible && result.protocol) {
          addProtocol(result.protocol);
          setQueuedPapers((prev) => prev.filter((p) => p.id !== queuedId));
          updateRuntime(targetProtocolId, (prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === procId
                ? { ...m, kind: 'confirmation', content: `Protocol ready: ${result.protocol.title}` }
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
    [protocol.id, addProtocol, pushMessages, updateRuntime]
  );

  const openFeedbackDrawer = useCallback(() => setIsFeedbackDrawerOpen(true), []);
  const closeFeedbackDrawer = useCallback(() => setIsFeedbackDrawerOpen(false), []);

  return useMemo(
    () => ({
      protocols: summaries,
      queuedPapers,
      activeProtocolId: protocol.id,
      setActiveProtocol,
      protocol,
      currentDay: protocol.currentDay,
      totalDays: protocol.totalDays,
      streak: protocol.streak,
      messages: state.messages,
      setsDone: state.setsDone,
      feedbackLogs: state.feedbackLogs ?? [],
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
      isStepComplete,
      incrementSet,
      decrementSet,
      toggleStep,
      markTodayComplete,
      logFeedback,
      askQuestion,
      uploadPaper,
      addProtocol,
      resetToDefaults,
      hasHydrated
    }),
    [
      summaries,
      queuedPapers,
      protocol,
      state.messages,
      state.setsDone,
      state.feedbackLogs,
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
      isStepComplete,
      incrementSet,
      decrementSet,
      toggleStep,
      markTodayComplete,
      logFeedback,
      askQuestion,
      uploadPaper,
      addProtocol,
      resetToDefaults,
      hasHydrated
    ]
  );
}

export type ProtocolState = ReturnType<typeof useProtocolState>;