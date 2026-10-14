import type { Protocol, QueuedPaper } from '../../types/protocol';
import { achillesProtocol } from './achilles';
import { hairLossProtocol } from './hairLoss';

export const protocols: Protocol[] = [achillesProtocol, hairLossProtocol];

export const initialQueuedPapers: QueuedPaper[] = [
{
  id: 'queued-sleep',
  name: 'Evening Light Restriction & Sleep Latency',
  note: 'pilot trial · awaiting your review'
}];