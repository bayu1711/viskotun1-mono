'use client';

import React from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import { AppShell } from '../components/layout/AppShell';
import { AssistantProvider } from '../contexts/AssistantContext';
import { AuthProvider } from '../contexts/AuthContext';
import { PolicyLedgerProvider } from '../contexts/PolicyLedgerContext';
import { RoutineProvider } from '../contexts/RoutineContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <RoutineProvider missingDataFlagEnabled={true}>
          <AssistantProvider>
            <PolicyLedgerProvider>
              <AppShell>{children}</AppShell>
              <Toaster position="top-center" />
            </PolicyLedgerProvider>
          </AssistantProvider>
        </RoutineProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
