'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { type RoutineState, useRoutineState } from '../hooks/useRoutineState';

export interface RoutineContextValue extends RoutineState {
  missingDataFlagEnabled: boolean;
}

export interface RoutineProviderProps {
  children: React.ReactNode;
  missingDataFlagEnabled?: boolean;
}

const RoutineContext = createContext<RoutineContextValue | null>(null);

export function RoutineProvider({ children, missingDataFlagEnabled = true }: RoutineProviderProps) {
  return (
    <RoutineStateProvider missingDataFlagEnabled={missingDataFlagEnabled}>
      {children}
    </RoutineStateProvider>
  );
}

function RoutineStateProvider({ children, missingDataFlagEnabled = true }: RoutineProviderProps) {
  const state = useRoutineState();
  const value = useMemo(
    () => ({ ...state, missingDataFlagEnabled }),
    [state, missingDataFlagEnabled]
  );

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutine(): RoutineContextValue {
  const context = useContext(RoutineContext);
  if (!context) {
    throw new Error('useRoutine must be used within a RoutineProvider');
  }
  return context;
}

/** Backward-compatibility aliases */
export const ProtocolContext = RoutineContext;
export const ProtocolProvider = RoutineProvider;
export const useProtocol = useRoutine;
export type ProtocolContextValue = RoutineContextValue;
export type ProtocolProviderProps = RoutineProviderProps;
