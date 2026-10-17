'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { COPY } from '../data/copy';
import type { RoutineStep, ProtocolStep } from '../types/routine';
import { RoutineContext } from './RoutineContext';

export type AssistantMode = 'ask' | 'upload';

export interface AssistantContextValue {
  isOpen: boolean;
  mode: AssistantMode;
  openAssistant: (mode?: AssistantMode) => void;
  closeAssistant: () => void;
  setMode: (mode: AssistantMode) => void;
  askAboutTask: (step: RoutineStep | ProtocolStep) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('ask');
  const routineContext = useContext(RoutineContext);
  const askQuestion = routineContext?.askQuestion;

  const openAssistant = useCallback((nextMode: AssistantMode = 'ask') => {
    setMode(nextMode);
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => setIsOpen(false), []);

  const askAboutTask = useCallback(
    (step: RoutineStep | ProtocolStep) => {
      setMode('ask');
      setIsOpen(true);
      if (askQuestion) {
        askQuestion(COPY.task.taskQuestionPrompt(step.action));
      }
    },
    [askQuestion]
  );

  const value = useMemo(
    () => ({ isOpen, mode, openAssistant, closeAssistant, setMode, askAboutTask }),
    [isOpen, mode, openAssistant, closeAssistant, askAboutTask]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}