import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/layout/AppShell';
import { AssistantProvider } from './contexts/AssistantContext';
import { ProtocolProvider } from './contexts/ProtocolContext';
import { ROUTES } from './data/navigation';
import { CommunityPage } from './pages/Community';
import { DashboardPage } from './pages/Dashboard';
import { RoutinePage } from './pages/Routine';

interface AppProps {
  /** Simulates a paper that omitted execution parameters, surfacing the caution banner. */
  showMissingDataWarning?: boolean;
  /** Forces the physician summary export to fail so the error state can be reviewed. */
  simulateExportFailure?: boolean;
}

export function App({ showMissingDataWarning = true, simulateExportFailure = false }: AppProps) {
  return (
    <BrowserRouter>
      <ProtocolProvider missingDataFlagEnabled={showMissingDataWarning}>
        <AssistantProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path={ROUTES.routine} element={<RoutinePage />} />
              <Route
                path={ROUTES.dashboard}
                element={<DashboardPage simulateExportFailure={simulateExportFailure} />} />
              
              <Route path={ROUTES.community} element={<CommunityPage />} />
              <Route path="*" element={<Navigate to={ROUTES.routine} replace />} />
            </Route>
          </Routes>
          <Toaster position="top-center" />
        </AssistantProvider>
      </ProtocolProvider>
    </BrowserRouter>);

}