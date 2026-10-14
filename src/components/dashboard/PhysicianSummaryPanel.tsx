import React, { useCallback, useId } from 'react';
import { toast } from 'sonner';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { useSimulatedExport } from '../../hooks/useSimulatedExport';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';

interface PhysicianSummaryPanelProps {
  simulateFailure: boolean;
}

export function PhysicianSummaryPanel({ simulateFailure }: PhysicianSummaryPanelProps) {
  const { protocol } = useProtocol();
  const headingId = useId();

  const handleSuccess = useCallback(() => toast.success(COPY.physicianSummary.successToast), []);
  const handleError = useCallback(() => toast.error(COPY.physicianSummary.errorToast), []);
  const { status, runExport } = useSimulatedExport({
    shouldFail: simulateFailure,
    onSuccess: handleSuccess,
    onError: handleError
  });
  const isLoading = status === 'loading';

  return (
    <Panel tone="ink" aria-labelledby={headingId}>
      <p className="text-sm lowercase leading-none text-white/45">{COPY.physicianSummary.eyebrow}</p>
      <h2 id={headingId} className="mt-1 text-2xl lowercase">
        {COPY.physicianSummary.title}
      </h2>
      <p className="mt-3 text-sm text-white/55">{COPY.physicianSummary.body(protocol.shortTitle)}</p>

      <PillButton variant="inverse" size="md" fullWidth className="mt-5" loading={isLoading} onClick={runExport}>
        {isLoading ? COPY.physicianSummary.exporting : COPY.physicianSummary.export}
      </PillButton>

      <div aria-live="polite">
        {status === 'success' &&
        <p className="mt-3 text-center text-xs lowercase text-mint">{COPY.physicianSummary.success}</p>
        }
        {status === 'error' &&
        <div role="alert" className="mt-3 rounded-tile bg-blush px-4 py-3 text-sm text-ink">
            <p>{COPY.physicianSummary.error}</p>
            <button
            type="button"
            onClick={runExport}
            className="mt-1 text-xs lowercase text-ink/60 underline underline-offset-2 hover:text-ink">
            
              {COPY.physicianSummary.retry}
            </button>
          </div>
        }
      </div>
    </Panel>);

}