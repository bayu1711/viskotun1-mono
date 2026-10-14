import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  return { ...message, id: createId('msg'), timestamp: nowLabel() };
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

  const askQuestion = (text: string) => {
    const target = protocol;
    pushMessages(target.id, { role: 'user', kind: 'question', content: text });
    updateRuntime(target.id, (prev) => ({ ...prev, assistantTyping: true }));
    const timer = window.setTimeout(() => {
      pushMessages(target.id, { role: 'ai', kind: 'answer', content: answerFor(target, text) });
      updateRuntime(target.id, (prev) => ({ ...prev, assistantTyping: false }));
      replyTimers.current = replyTimers.current.filter((item) => item !== timer);
    }, ASSISTANT_REPLY_DELAY_MS);
    replyTimers.current = [...replyTimers.current, timer];
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

  const uploadPaper = (source: string, extractedProtocol?: Protocol) => {
    if (extractedProtocol) {
      addProtocol(extractedProtocol);
      return;
    }
    pushMessages(
      protocol.id,
      { role: 'user', kind: 'file', content: source },
      { role: 'ai', kind: 'processing', content: source, createdAt: Date.now() }
    );
    setQueuedPapers((prev) => [...prev, { id: createId('queued'), name: source, note: COPY.papers.queuedNote }]);
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