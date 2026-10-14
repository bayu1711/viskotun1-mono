import { useCallback, useEffect, useRef, useState } from 'react';
import { EXPORT_SIMULATED_DELAY_MS } from '../data/config';

export type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface SimulatedExportOptions {
  shouldFail: boolean;
  onSuccess?: () => void;
  onError?: () => void;
}

/** Simulates an async export with explicit loading, success and error states. */
export function useSimulatedExport({ shouldFail, onSuccess, onError }: SimulatedExportOptions) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const timerRef = useRef<number>();

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const runExport = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setStatus('loading');
    timerRef.current = window.setTimeout(() => {
      if (shouldFail) {
        setStatus('error');
        onError?.();
      } else {
        setStatus('success');
        onSuccess?.();
      }
    }, EXPORT_SIMULATED_DELAY_MS);
  }, [shouldFail, onSuccess, onError]);

  return { status, runExport };
}