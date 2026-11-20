'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { ONBOARDING_DISMISSED_KEY, useAuth } from '../../contexts/AuthContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { useFileDrop } from '../../hooks/useFileDrop';
import { isPdfFile } from '../../utils/files';
import { AssistantSheet } from '../assistant/AssistantSheet';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { FeedbackDrawer } from '../routine/FeedbackDrawer';
import { CommunityReviewDrawer } from '../community/CommunityReviewDrawer';
import { PolicyLedgerDrawer } from '../admin/PolicyLedgerDrawer';
import { HowToModal } from '../howto/HowToModal';
import { ReEntryModal } from '../routine/ReEntryModal';
import { BctLedgerDrawer } from '../bct/BctLedgerDrawer';
import { ShareRoutineModal } from '../routine/ShareRoutineModal';
import { DoseModeModal } from '../routine/DoseModeModal';
import { AdaptiveLifestyleModal } from '../routine/AdaptiveLifestyleModal';
import { AssistantFab } from './AssistantFab';
import { FileDropOverlay } from './FileDropOverlay';
import { MobileTabBar } from './MobileTabBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { uploadPaper, hasHydrated } = useRoutine();
  const { openAssistant, openLifestyleTuning, isOpen: isAssistantOpen } = useAssistant();
  const { user, isLoading: isAuthLoading, isAuthenticated, isGuest, lifestyleProfile } = useAuth();
  const hasPromptedOnboardingRef = useRef(false);
  const onboardingTimerRef = useRef<number | null>(null);

  const isDragging = useFileDrop((file) => {
    if (!isPdfFile(file)) {
      toast.error(COPY.upload.invalidType);
      return;
    }
    openAssistant('upload');
    uploadPaper(file);
  });

  const isPublicPage =
    pathname === '/' ||
    pathname === '/uae' ||
    pathname === '/login' ||
    pathname === '/signup';

  useEffect(() => {
    if (!user) {
      hasPromptedOnboardingRef.current = false;
    }
  }, [user]);

  // Automatically popup the guided Adaptive Lifestyle interview once for newly registered / un-onboarded workspace users
  useEffect(() => {
    if (isPublicPage || pathname === ROUTES.profile) return;
    if (isAuthLoading || !hasHydrated || isAssistantOpen) return;
    if (!isAuthenticated && !isGuest) return;
    if (lifestyleProfile.intakeCompleted || hasPromptedOnboardingRef.current) return;

    try {
      if (window.sessionStorage.getItem(ONBOARDING_DISMISSED_KEY)) return;
    } catch {
      // Fail-safe continue
    }

    hasPromptedOnboardingRef.current = true;
    onboardingTimerRef.current = window.setTimeout(() => {
      openLifestyleTuning();
    }, 350);

    return () => {
      if (onboardingTimerRef.current !== null) {
        window.clearTimeout(onboardingTimerRef.current);
        onboardingTimerRef.current = null;
      }
    };
  }, [
    isPublicPage,
    pathname,
    isAuthLoading,
    hasHydrated,
    isAssistantOpen,
    isAuthenticated,
    isGuest,
    lifestyleProfile.intakeCompleted,
    openLifestyleTuning
  ]);

  if (isPublicPage) {
    return (
      <div className="min-h-screen w-full bg-canvas font-sans text-ink">
        <main className="w-full">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <AssistantSheet />
        <FileDropOverlay visible={isDragging} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-canvas font-sans text-ink">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pb-28">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <AssistantFab />
        <MobileTabBar />
      </div>

      <AssistantSheet />
      <FeedbackDrawer />
      <CommunityReviewDrawer />
      <PolicyLedgerDrawer />
      <HowToModal />
      <ReEntryModal />
      <BctLedgerDrawer />
      <ShareRoutineModal />
      <DoseModeModal />
      <AdaptiveLifestyleModal />
      <FileDropOverlay visible={isDragging} />
    </div>
  );
}