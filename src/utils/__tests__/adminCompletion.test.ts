import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import type { Routine } from '../../types/routine';
import {
  adherenceOf,
  isRoutineCompleted,
  resolveBiomarkerPoints,
  resolveMilestoneDays
} from '../routineMetrics';

describe('Admin Testing Controls - Simulate Full Completion', () => {
  it('exposes centralized copy strings for admin testing controls', () => {
    expect(COPY.dayActions.adminControlEyebrow).toBe('Admin Testing Controls');
    expect(COPY.dayActions.simulateFullCompletion).toBe('Simulate fully complete paper (Admin)');
    expect(COPY.dayActions.simulateFullCompletionToast('Achilles Tendinopathy', 84)).toBe(
      'Simulated full research trial for Achilles Tendinopathy (84 days)'
    );
    expect(COPY.assistant.simulatedFullCompletionConfirmation('Achilles Tendinopathy', 84)).toContain(
      'Simulated complete clinical research trial for Achilles Tendinopathy'
    );
  });

  it('validates routine is fully completed when simulated with totalDays', () => {
    const mockRoutine: Partial<Routine> = {
      id: 'test-protocol',
      currentDay: 84,
      totalDays: 84,
      dayHistory: new Array(84).fill(1.0)
    };

    expect(isRoutineCompleted(mockRoutine as Routine, true)).toBe(true);
    expect(isRoutineCompleted(mockRoutine as Routine, false)).toBe(true);
  });

  it('calculates 100% adherence rate across all completed study days', () => {
    const totalDays = 84;
    const routine: Routine = {
      id: 'achilles-simulated',
      title: 'Achilles Tendinopathy Protocol',
      shortTitle: 'achilles',
      icon: 'straight-knee',
      totalDays,
      currentDay: totalDays,
      streak: totalDays,
      steps: [
        {
          id: 'step-1',
          tone: 'mint',
          icon: 'straight-knee',
          action: 'Eccentric Heel Drops',
          sets: 3,
          reps: 15,
          frequency: '2x Daily'
        }
      ],
      progressionRules: [],
      contraindications: [],
      missingDataFlags: [],
      dayHistory: new Array(totalDays).fill(1.0)
    };

    const adherence = adherenceOf(routine, 1.0);
    expect(adherence).toBe(100);
  });

  it('resolves biomarker and photo milestone points accurately for completed study duration', () => {
    const milestoneDays = resolveMilestoneDays(
      {
        id: 'hair-vertex-photo',
        name: 'Vertex Scalp Photo',
        label: 'Clinical Photo',
        type: 'photo',
        frequency: 'milestone',
        milestoneDays: [1, 14, 28, 56, 84]
      },
      84
    );

    expect(milestoneDays).toEqual([1, 14, 28, 56, 84]);

    const morphingLogs = [
      { id: 'm-1', fieldId: 'pain-scale', day: 1, value: 3, loggedAt: 'Day 1' },
      { id: 'm-2', fieldId: 'pain-scale', day: 42, value: 1, loggedAt: 'Day 42' },
      { id: 'm-3', fieldId: 'pain-scale', day: 84, value: 0, loggedAt: 'Day 84' }
    ];

    const points = resolveBiomarkerPoints(
      {
        id: 'pain-scale',
        name: 'Pain VAS',
        label: 'Pain Score',
        type: 'scale',
        frequency: 'daily'
      },
      morphingLogs,
      []
    );

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ day: 1, value: 3 });
    expect(points[2]).toEqual({ day: 84, value: 0 });
  });
});
