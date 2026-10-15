'use client';

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  GuardrailPolicy,
  GuardrailUpdateRequest,
  GuardrailLedgerResponse
} from '../types/guardrails';

interface PolicyLedgerContextValue {
  policy: GuardrailPolicy | null;
  isLiveFirestore: boolean;
  firestoreStatus: 'connected' | 'unconfigured' | 'error';
  lastSyncedAt: string;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openPolicyDrawer: () => void;
  closePolicyDrawer: () => void;
  refreshPolicy: () => Promise<void>;
  updatePolicy: (updates: GuardrailUpdateRequest) => Promise<boolean>;
  resetPolicy: () => Promise<boolean>;
}

const PolicyLedgerContext = createContext<PolicyLedgerContextValue | null>(null);

export function PolicyLedgerProvider({ children }: { children: React.ReactNode }) {
  const [policy, setPolicy] = useState<GuardrailPolicy | null>(null);
  const [isLiveFirestore, setIsLiveFirestore] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<'connected' | 'unconfigured' | 'error'>('unconfigured');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const refreshPolicy = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/guardrails');
      if (res.ok) {
        const data: GuardrailLedgerResponse = await res.json();
        setPolicy(data.policy);
        setIsLiveFirestore(data.isLiveFirestore);
        setFirestoreStatus(data.firestoreStatus);
        setLastSyncedAt(data.lastSyncedAt);
      }
    } catch (err) {
      console.warn('[PolicyLedgerContext] Could not fetch live policy ledger:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPolicy();
  }, [refreshPolicy]);

  const openPolicyDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closePolicyDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const updatePolicy = useCallback(
    async (updates: GuardrailUpdateRequest): Promise<boolean> => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/guardrails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        if (res.ok) {
          const data = await res.json();
          setPolicy(data.policy);
          setIsLiveFirestore(data.isLiveFirestore);
          setFirestoreStatus(data.firestoreStatus);
          setLastSyncedAt(new Date().toISOString());
          toast.success('Clinical guardrail policy ledger updated');
          return true;
        } else {
          toast.error('Failed to update guardrail policy ledger');
          return false;
        }
      } catch (err) {
        console.error('[PolicyLedgerContext] Update error:', err);
        toast.error('Network error updating policy ledger');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetPolicy = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/guardrails', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setPolicy(data.policy);
        setIsLiveFirestore(data.isLiveFirestore);
        setFirestoreStatus(data.firestoreStatus);
        setLastSyncedAt(new Date().toISOString());
        toast.success('Guardrails reset to baseline clinical standards');
        return true;
      }
      return false;
    } catch {
      toast.error('Failed to reset guardrails');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      policy,
      isLiveFirestore,
      firestoreStatus,
      lastSyncedAt,
      isLoading,
      isDrawerOpen,
      openPolicyDrawer,
      closePolicyDrawer,
      refreshPolicy,
      updatePolicy,
      resetPolicy
    }),
    [
      policy,
      isLiveFirestore,
      firestoreStatus,
      lastSyncedAt,
      isLoading,
      isDrawerOpen,
      openPolicyDrawer,
      closePolicyDrawer,
      refreshPolicy,
      updatePolicy,
      resetPolicy
    ]
  );

  return (
    <PolicyLedgerContext.Provider value={value}>
      {children}
    </PolicyLedgerContext.Provider>
  );
}

export function usePolicyLedger(): PolicyLedgerContextValue {
  const context = useContext(PolicyLedgerContext);
  if (!context) {
    throw new Error('usePolicyLedger must be used within a PolicyLedgerProvider');
  }
  return context;
}
