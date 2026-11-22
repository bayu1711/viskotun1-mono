'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { COPY } from '../data/copy';
import type { RoutineStep } from '../types/routine';
import { RoutineContext } from './RoutineContext';

export type AssistantMode = 'ask' | 'upload' | 'lifestyle';

export interface AssistantContextValue {
  isOpen: boolean;
  mode: AssistantMode;
  openAssistant: (mode?: AssistantMode) => void;
  closeAssistant: () => void;
  setMode: (mode: AssistantMode) => void;
  askAboutTask: (step: RoutineStep) => void;
  openLifestyleTuning: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('ask');
  const routineContext = useContext(RoutineContext);
  const askQuestion = routineContext?.askQuestion;

  const openAssistant = useCallback((_nextMode: AssistantMode = 'ask') => {
    setMode('ask');
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => setIsOpen(false), []);

  const askAboutTask = useCallback(
    (step: RoutineStep) => {
      setMode('ask');
      setIsOpen(true);
      if (askQuestion) {
        askQuestion(COPY.task.taskQuestionPrompt(step.action));
      }
    },
    [askQuestion]
  );

  const openLifestyleTuning = useCallback(() => {
    setMode('ask');
    setIsOpen(true);
  }, []);

  const value = useMemo(
    () => ({ isOpen, mode, openAssistant, closeAssistant, setMode, askAboutTask, openLifestyleTuning }),
    [isOpen, mode, openAssistant, closeAssistant, askAboutTask, openLifestyleTuning]
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