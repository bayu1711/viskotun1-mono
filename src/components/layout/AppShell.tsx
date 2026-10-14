'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { useFileDrop } from '../../hooks/useFileDrop';
import { isPdfFile } from '../../utils/files';
import { AssistantSheet } from '../assistant/AssistantSheet';
import { PainLogDrawer } from '../routine/PainLogDrawer';
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
  const { uploadPaper } = useProtocol();
  const { openAssistant } = useAssistant();

  const isDragging = useFileDrop((file) => {
    if (!isPdfFile(file)) {
      toast.error(COPY.upload.invalidType);
      return;
    }
    uploadPaper(file);
    openAssistant('ask');
  });

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';

  if (isPublicPage) {
    return (
      <div className="min-h-screen w-full bg-canvas font-sans text-ink">
        <main className="w-full">{children}</main>
        <AssistantSheet />
        <PainLogDrawer />
        <FileDropOverlay visible={isDragging} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-canvas font-sans text-ink">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pb-28">{children}</main>
        <AssistantFab />
        <MobileTabBar />
      </div>

      <AssistantSheet />
      <PainLogDrawer />
      <FileDropOverlay visible={isDragging} />
    </div>
  );
}