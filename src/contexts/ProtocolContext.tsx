import React, { createContext, useContext } from 'react';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import { EmptyState } from '../components/feedback/EmptyState';
import { COPY } from '../data/copy';
import { protocols } from '../data/protocols';
import { type ProtocolState, useProtocolState } from '../hooks/useProtocolState';

interface ProtocolContextValue extends ProtocolState {
  missingDataFlagEnabled: boolean;
}

interface ProtocolProviderProps {
  children: React.ReactNode;
  missingDataFlagEnabled: boolean;
}

const ProtocolContext = createContext<ProtocolContextValue | null>(null);

export function ProtocolProvider({ children, missingDataFlagEnabled }: ProtocolProviderProps) {
  if (protocols.length === 0) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center bg-canvas p-6 font-sans text-ink">
        <EmptyState
          icon={LibraryBooksOutlinedIcon}
          title={COPY.errors.noProtocolsTitle}
          description={COPY.errors.noProtocolsBody}
          className="w-full max-w-sm bg-white" />
        
      </main>);

  }

  return (
    <ProtocolStateProvider missingDataFlagEnabled={missingDataFlagEnabled}>{children}</ProtocolStateProvider>);

}

function ProtocolStateProvider({ children, missingDataFlagEnabled }: ProtocolProviderProps) {
  const state = useProtocolState();
  return (
    <ProtocolContext.Provider value={{ ...state, missingDataFlagEnabled }}>{children}</ProtocolContext.Provider>);

}

export function useProtocol(): ProtocolContextValue {
  const context = useContext(ProtocolContext);
  if (!context) {
    throw new Error('useProtocol must be used within a ProtocolProvider');
  }
  return context;
}