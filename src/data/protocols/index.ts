import type { Protocol, QueuedPaper } from '../../types/protocol';
import { COPY } from '../copy';
import { achillesProtocol } from './achilles';
import { hairLossProtocol } from './hairLoss';

export const protocols: Protocol[] = [achillesProtocol, hairLossProtocol];

export const initialQueuedPapers: QueuedPaper[] = [
  {
    id: 'queued-sleep',
    name: COPY.papers.initialQueuedPaperName,
    note: COPY.papers.initialQueuedPaperNote
  }
];