'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AppShell } from '../components/layout/AppShell';
import { AssistantProvider } from '../contexts/AssistantContext';
import { AuthProvider } from '../contexts/AuthContext';
import { PolicyLedgerProvider } from '../contexts/PolicyLedgerContext';
import { ProtocolProvider } from '../contexts/ProtocolContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ProtocolProvider missingDataFlagEnabled={true}>
        <AssistantProvider>
          <PolicyLedgerProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="top-center" />
          </PolicyLedgerProvider>
        </AssistantProvider>
      </ProtocolProvider>
    </AuthProvider>
  );
}
