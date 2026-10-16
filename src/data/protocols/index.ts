import type { Protocol, QueuedPaper } from '../../types/protocol';
import { achillesProtocol } from './achilles';
import { hairLossProtocol } from './hairLoss';
import { FALLBACK_CREATINE_SLEEP } from '../../server/fallbackProtocols';

/** Pre-calibrated sample protocols available on demand via the How-To guide */
export const sampleProtocols: Protocol[] = [
  achillesProtocol,
  hairLossProtocol,
  FALLBACK_CREATINE_SLEEP
];

/** Clean initial state: zero pre-loaded protocols so users start with a clean onboarding slate */
export const initialProtocols: Protocol[] = [];
export const protocols: Protocol[] = [];
export const initialQueuedPapers: QueuedPaper[] = [];