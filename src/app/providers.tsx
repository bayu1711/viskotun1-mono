'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AppShell } from '../components/layout/AppShell';
import { AssistantProvider } from '../contexts/AssistantContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtocolProvider } from '../contexts/ProtocolContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ProtocolProvider missingDataFlagEnabled={true}>
        <AssistantProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-center" />
        </AssistantProvider>
      </ProtocolProvider>
    </AuthProvider>
  );
}
