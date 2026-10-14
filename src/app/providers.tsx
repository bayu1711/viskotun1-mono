'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AppShell } from '../components/layout/AppShell';
import { AssistantProvider } from '../contexts/AssistantContext';
import { ProtocolProvider } from '../contexts/ProtocolContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ProtocolProvider missingDataFlagEnabled={true}>
      <AssistantProvider>
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" />
      </AssistantProvider>
    </ProtocolProvider>
  );
}
