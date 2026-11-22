import { describe, expect, it } from 'vitest';
import {
  mergeCloudState,
  mergeRoutineRuntime,
  rememberRemoteVersion
} from '../cloudSync';
import type { Routine, RoutineRuntime } from '../../types/routine';

describe('cloudSync', () => {
  it('merges routine runtime by unioning logs and taking max sets', () => {
    const local: RoutineRuntime = {
      setsDone: { 'step-1': 3, 'step-2': 1 },
      feedbackLogs: [{ id: 'f-1', day: 1, score: 8, note: 'Good', loggedAt: '2026-01-01' }],
      morphingLogs: [],
      messages: [],
      escalationPaused: false
    };

    const remote: RoutineRuntime = {
      setsDone: { 'step-1': 2, 'step-2': 4 },
      feedbackLogs: [{ id: 'f-2', day: 2, score: 7, note: 'Tired', loggedAt: '2026-01-02' }],
      morphingLogs: [],
      messages: [],
      escalationPaused: false
    };

    const merged = mergeRoutineRuntime(local, remote);
    expect(merged.setsDone['step-1']).toBe(3);
    expect(merged.setsDone['step-2']).toBe(4);
    expect(merged.feedbackLogs.length).toBe(2);
  });

  it('merges cloud state by unioning routines', () => {
    const local = {
      activeRoutineId: 'routine-1',
      routines: [{ id: 'routine-1', title: 'Routine 1' } as Routine],
      runtime: {}
    };

    const remote = {
      activeRoutineId: 'routine-2',
      routines: [{ id: 'routine-2', title: 'Routine 2' } as Routine],
      runtime: {}
    };

    const merged = mergeCloudState(local, remote);
    expect(merged.routines.length).toBe(2);
    expect(merged.activeRoutineId).toBe('routine-1');
  });
});
