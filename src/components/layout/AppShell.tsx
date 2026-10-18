'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { useFileDrop } from '../../hooks/useFileDrop';
import { isPdfFile } from '../../utils/files';
import { AssistantSheet } from '../assistant/AssistantSheet';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { FeedbackDrawer } from '../routine/FeedbackDrawer';
import { CommunityReviewDrawer } from '../community/CommunityReviewDrawer';
import { PolicyLedgerDrawer } from '../admin/PolicyLedgerDrawer';
import { HowToModal } from '../howto/HowToModal';
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
  const { uploadPaper } = useRoutine();
  const { openAssistant } = useAssistant();

  const isDragging = useFileDrop((file) => {
    if (!isPdfFile(file)) {
      toast.error(COPY.upload.invalidType);
      return;
    }
    openAssistant('upload');
    uploadPaper(file).then((result) => {
      if (result && !result.eligible) {
        openAssistant('ask');
      }
    });
  });

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';

  if (isPublicPage) {
    return (
      <div className="min-h-screen w-full bg-canvas font-sans text-ink">
        <main className="w-full">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <AssistantSheet />
        <FeedbackDrawer />
        <CommunityReviewDrawer />
        <PolicyLedgerDrawer />
        <HowToModal />
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
      <FileDropOverlay visible={isDragging} />
    </div>
  );
}