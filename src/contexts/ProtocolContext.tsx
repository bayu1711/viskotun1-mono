'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { type ProtocolState, useProtocolState } from '../hooks/useProtocolState';

interface ProtocolContextValue extends ProtocolState {
  missingDataFlagEnabled: boolean;
}

interface ProtocolProviderProps {
  children: React.ReactNode;
  missingDataFlagEnabled?: boolean;
}

const ProtocolContext = createContext<ProtocolContextValue | null>(null);

export function ProtocolProvider({ children, missingDataFlagEnabled = true }: ProtocolProviderProps) {
  return (
    <ProtocolStateProvider missingDataFlagEnabled={missingDataFlagEnabled}>
      {children}
    </ProtocolStateProvider>
  );
}

function ProtocolStateProvider({ children, missingDataFlagEnabled = true }: ProtocolProviderProps) {
  const state = useProtocolState();
  const value = useMemo(
    () => ({ ...state, missingDataFlagEnabled }),
    [state, missingDataFlagEnabled]
  );

  return <ProtocolContext.Provider value={value}>{children}</ProtocolContext.Provider>;
}

export function useProtocol(): ProtocolContextValue {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}