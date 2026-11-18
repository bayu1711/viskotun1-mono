import type { Routine, QueuedPaper } from '../../types/routine';
import { achillesRoutine } from './achilles';
import { hairLossRoutine } from './hairLoss';
import { FALLBACK_CREATINE_SLEEP } from '../../server/fallbackRoutines';

export { achillesRoutine, hairLossRoutine };

/** Pre-calibrated sample routines available on demand via the How-To guide */
export const sampleRoutines: Routine[] = [
  achillesRoutine,
  hairLossRoutine,
  FALLBACK_CREATINE_SLEEP
];

/** Clean initial state: zero pre-loaded routines so users start with a clean onboarding slate */
export const initialRoutines: Routine[] = [];
export const routines: Routine[] = [];
export const initialQueuedPapers: QueuedPaper[] = [];
