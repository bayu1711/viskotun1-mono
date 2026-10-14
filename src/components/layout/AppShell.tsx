import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { useFileDrop } from '../../hooks/useFileDrop';
import { isPdfFile } from '../../utils/files';
import { AssistantSheet } from '../assistant/AssistantSheet';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { AssistantFab } from './AssistantFab';
import { FileDropOverlay } from './FileDropOverlay';
import { MobileTabBar } from './MobileTabBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const { uploadPaper } = useProtocol();
  const { openAssistant } = useAssistant();
  const { pathname } = useLocation();

  const isDragging = useFileDrop((file) => {
    if (!isPdfFile(file)) {
      toast.error(COPY.upload.invalidType);
      return;
    }
    uploadPaper(file.name);
    openAssistant('ask');
  });

  return (
    <div className="flex min-h-screen w-full bg-canvas font-sans text-ink">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pb-28">
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <AssistantFab />
        <MobileTabBar />
      </div>

      <AssistantSheet />
      <FileDropOverlay visible={isDragging} />
    </div>);

}