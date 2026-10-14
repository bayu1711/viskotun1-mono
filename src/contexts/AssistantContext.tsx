'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AssistantMode = 'ask' | 'upload';

interface AssistantContextValue {
  isOpen: boolean;
  mode: AssistantMode;
  openAssistant: (mode?: AssistantMode) => void;
  closeAssistant: () => void;
  setMode: (mode: AssistantMode) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: {children: React.ReactNode;}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('ask');

  const openAssistant = useCallback((nextMode: AssistantMode = 'ask') => {
    setMode(nextMode);
    setIsOpen(true);
  }, []);

  const closeAssistant = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, mode, openAssistant, closeAssistant, setMode }),
    [isOpen, mode, openAssistant, closeAssistant]
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