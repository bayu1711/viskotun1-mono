import type { Routine, Protocol, QueuedPaper } from '../../types/routine';
import { achillesRoutine, achillesProtocol } from './achilles';
import { hairLossRoutine, hairLossProtocol } from './hairLoss';
import { FALLBACK_CREATINE_SLEEP } from '../../server/fallbackRoutines';

export { achillesRoutine, achillesProtocol, hairLossRoutine, hairLossProtocol };

/** Pre-calibrated sample routines available on demand via the How-To guide */
export const sampleRoutines: Routine[] = [
  achillesRoutine,
  hairLossRoutine,
  FALLBACK_CREATINE_SLEEP
];

export const sampleProtocols: Protocol[] = sampleRoutines;

/** Clean initial state: zero pre-loaded routines so users start with a clean onboarding slate */
export const initialRoutines: Routine[] = [];
export const routines: Routine[] = [];
export const initialProtocols: Protocol[] = initialRoutines;
export const protocols: Protocol[] = routines;
export const initialQueuedPapers: QueuedPaper[] = [];