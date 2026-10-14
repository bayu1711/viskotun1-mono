import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ASSISTANT_REPLY_DELAY_MS, DEFAULT_CONFIRMATION_PAIN_SCORE } from '../data/config';
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
  exceedsPainThreshold,
  isProgressionReady
} from '../utils/protocolMetrics';
import { nowLabel } from '../utils/time';

function createInitialRuntime(items: Protocol[]): Record<string, ProtocolRuntime> {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        setsDone: { ...item.initialSetsDone },
        painLogs: item.initialPainLogs,
        messages: item.initialMessages,
        escalationPaused: false,
        assistantTyping: false
      }
    ])
  );
}

function buildMessage(message: NewChatMessage): ChatMessage {
  return { ...message, id: message.id ?? createId('msg'), timestamp: nowLabel() };
}

/** All protocol session state + actions. Only raw state is stored; metrics are derived on render. */
export function useProtocolState() {
  const [protocolList, setProtocolList] = useState<Protocol[]>(initialProtocols);
  const [activeProtocolId, setActiveProtocol] = useState(initialProtocols[0].id);
  const [queuedPapers, setQueuedPapers] = useState<QueuedPaper[]>(initialQueuedPapers);
  const [isPainLogOpen, setIsPainLogOpen] = useState(false);
  const [runtime, setRuntime] = useState(() => createInitialRuntime(initialProtocols));
  const replyTimers = useRef<number[]>([]);

  // Safe timer cleanup on unmount
  useEffect(() => {
    return () => {
      replyTimers.current.forEach((timer) => window.clearTimeout(timer));
      replyTimers.current = [];
    };
  }, []);

  const protocol = protocolList.find((item) => item.id === activeProtocolId) ?? protocolList[0];
  const state = runtime[protocol.id] ?? {
    setsDone: {},
    painLogs: [],
    messages: [],
    escalationPaused: false,
    assistantTyping: false
  };

  const updateRuntime = useCallback((id: string, update: (prev: ProtocolRuntime) => ProtocolRuntime) => {
    setRuntime((prev) => {
      const current = prev[id] ?? {
        setsDone: {},
        painLogs: [],
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
  const progressionReady = isProgressionReady(state.painLogs, state.escalationPaused);

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

  const findStep = (stepId: string) => protocol.steps.find((step) => step.id === stepId);

  const isStepComplete = (stepId: string) => {
    const step = findStep(stepId);
    return step ? (state.setsDone[stepId] ?? 0) >= step.sets : false;
  };

  const updateSetCount = (stepId: string, next: (current: number, max: number) => number) => {
    const step = findStep(stepId);
    if (!step) return;
    updateRuntime(protocol.id, (prev) => ({
      ...prev,
      setsDone: {
        ...prev.setsDone,
        [stepId]: clamp(next(prev.setsDone[stepId] ?? 0, step.sets), 0, step.sets)
      }
    }));
  };

  const incrementSet = (stepId: string) => updateSetCount(stepId, (current) => current + 1);
  const decrementSet = (stepId: string) => updateSetCount(stepId, (current) => current - 1);
  const toggleStep = (stepId: string) =>
    updateSetCount(stepId, (current, max) => (current >= max ? 0 : max));

  const markTodayComplete = () => {
    const allSetsDone = Object.fromEntries(protocol.steps.map((step) => [step.id, step.sets]));
    updateRuntime(protocol.id, (prev) => ({ ...prev, setsDone: allSetsDone }));
    const latestScore = state.painLogs[state.painLogs.length - 1]?.score ?? DEFAULT_CONFIRMATION_PAIN_SCORE;
    pushMessages(protocol.id, {
      role: 'ai',
      kind: 'confirmation',
      content: COPY.assistant.confirmLogged(protocol.currentDay, latestScore)
    });
  };

  const logPain = (score: number, note: string) => {
    const exceeded = exceedsPainThreshold(score);
    updateRuntime(protocol.id, (prev) => ({
      ...prev,
      escalationPaused: prev.escalationPaused || exceeded,
      painLogs: [
        ...prev.painLogs,
        { id: createId('pain'), day: protocol.currentDay, score, note, loggedAt: nowLabel() }
      ]
    }));
    pushMessages(
      protocol.id,
      exceeded
        ? { role: 'ai', kind: 'alert', content: COPY.safety.escalationAlert }
        : { role: 'ai', kind: 'confirmation', content: COPY.assistant.confirmSafe(protocol.currentDay, score) }
    );
  };

  const askQuestion = async (text: string) => {
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
  };

  const addProtocol = useCallback((newProtocol: Protocol) => {
    setProtocolList((prev) => {
      const exists = prev.some((p) => p.id === newProtocol.id);
      return exists ? prev.map((p) => (p.id === newProtocol.id ? newProtocol : p)) : [...prev, newProtocol];
    });
    setRuntime((prev) => ({
      ...prev,
      [newProtocol.id]: {
        setsDone: { ...(newProtocol.initialSetsDone ?? {}) },
        painLogs: newProtocol.initialPainLogs ?? [],
        messages: newProtocol.initialMessages ?? [],
        escalationPaused: false,
        assistantTyping: false
      }
    }));
    setActiveProtocol(newProtocol.id);
  }, []);

  const uploadPaper = async (source: string | File, extractedProtocol?: Protocol) => {
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
  };

  const openPainLog = useCallback(() => setIsPainLogOpen(true), []);
  const closePainLog = useCallback(() => setIsPainLogOpen(false), []);

  return {
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
    painLogs: state.painLogs,
    escalationPaused: state.escalationPaused,
    todayFraction,
    todayPercent,
    adherenceRate,
    dayIsComplete,
    progressionReady,
    assistantTyping: state.assistantTyping ?? false,
    isPainLogOpen,
    openPainLog,
    closePainLog,
    isStepComplete,
    incrementSet,
    decrementSet,
    toggleStep,
    markTodayComplete,
    logPain,
    askQuestion,
    uploadPaper,
    addProtocol
  };
}

export type ProtocolState = ReturnType<typeof useProtocolState>;