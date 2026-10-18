import { describe, expect, it } from 'vitest';
import { DEFAULT_FEEDBACK_METRIC } from '../../data/config';
import type { DataCollectionField, FeedbackLog, MorphingDataLog, Routine } from '../../types/routine';
import {
  adherenceOf,
  clampFeedbackScore,
  completionOf,
  complianceLevel,
  exceedsFeedbackThreshold,
  isProgressionReady,
  isRoutineCompleted,
  progressionStatus,
  resolveBiomarkerPoints,
  resolveFeedbackMetric,
  resolveFieldTargetBounds,
  resolveMilestoneDays
} from '../routineMetrics';

const mockRoutine: Routine = {
  id: 'test-routine',
  title: 'Test Routine',
  shortTitle: 'test',
  icon: 'fitness',
  phase: 'Phase 1',
  phaseLabel: 'week 1',
  totalDays: 14,
  currentDay: 1,
  streak: 1,
  paper: {
    title: 'Test Paper',
    fileName: 'test.pdf',
    authors: 'Dr. Test',
    year: 2024,
    journal: 'Test Journal',
    doi: '10.1000/test',
    sampleSize: 50,
    trialType: 'RCT',
    evidenceBadges: ['rct'],
    pages: 10
  },
  steps: [
    {
      id: 'step-1',
      tone: 'ink',
      icon: 'fitness',
      action: 'Step 1',
      detail: 'Detail',
      sets: 3,
      reps: 10,
      frequency: 'Daily'
    },
    {
      id: 'step-2',
      tone: 'cream',
      icon: 'timer',
      action: 'Step 2',
      detail: 'Detail',
      sets: 2,
      reps: 1,
      frequency: 'Daily'
    }
  ],
  progressionRules: [
    { id: 'rule-1', condition: 'adverse score < 2', action: 'increase load' }
  ],
  contraindications: [
    { id: 'c-1', text: 'stop on sharp discomfort', severity: 'stop' }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  initialFeedbackLogs: [],
  initialMessages: [],
  community: {
    studyEfficacy: 80,
    realWorldEfficacy: 75,
    userCount: 100,
    medianAdherence: 80,
    dropOffUnit: 'day',
    peakPeriod: 3,
    dropOff: [],
    insightLead: '',
    insightRest: '',
    reviews: []
  },
  faqs: []
};

describe('routineMetrics', () => {
  describe('adherenceOf', () => {
    it('accurately calculates day 1 adherence without exceeding 100%', () => {
      const day1Routine: Routine = {
        ...mockRoutine,
        currentDay: 1,
        dayHistory: []
      };

      expect(adherenceOf(day1Routine, 0)).toBe(0);
      expect(adherenceOf(day1Routine, 0.5)).toBe(50);
      expect(adherenceOf(day1Routine, 1)).toBe(100);
    });

    it('safely handles past dayHistory without double-counting today', () => {
      const day4Routine: Routine = {
        ...mockRoutine,
        currentDay: 4,
        dayHistory: [1, 0.67, 1] // 3 past days
      };

      // (1 + 0.67 + 1 + 1) / 4 = 3.67 / 4 = 0.9175 -> 92%
      expect(adherenceOf(day4Routine, 1)).toBe(92);
      // (1 + 0.67 + 1 + 0) / 4 = 2.67 / 4 = 0.6675 -> 67%
      expect(adherenceOf(day4Routine, 0)).toBe(67);
    });

    it('clamps adherence to 100% even if extra days exist in history', () => {
      const overflowRoutine: Routine = {
        ...mockRoutine,
        currentDay: 2,
        dayHistory: [1, 1, 1, 1]
      };

      expect(adherenceOf(overflowRoutine, 1)).toBe(100);
    });

    it('returns 0 if currentDay is 0 or negative', () => {
      const zeroRoutine: Routine = {
        ...mockRoutine,
        currentDay: 0,
        dayHistory: []
      };
      expect(adherenceOf(zeroRoutine, 1)).toBe(0);
    });
  });

  describe('completionOf', () => {
    it('calculates ratio of completed sets across steps', () => {
      // Total sets = 3 (step-1) + 2 (step-2) = 5
      expect(completionOf(mockRoutine, {})).toBe(0);
      expect(completionOf(mockRoutine, { 'step-1': 3, 'step-2': 2 })).toBe(1);
      expect(completionOf(mockRoutine, { 'step-1': 1, 'step-2': 1 })).toBe(2 / 5);
    });

    it('clamps setsDone per step so it never exceeds step.sets', () => {
      expect(completionOf(mockRoutine, { 'step-1': 10, 'step-2': 10 })).toBe(1);
    });

    it('correctly re-normalizes ratio when steps are excluded by user', () => {
      // step-2 (2 sets) is excluded, leaving step-1 (3 sets) as the sole active step
      expect(completionOf(mockRoutine, {}, ['step-2'])).toBe(0);
      expect(completionOf(mockRoutine, { 'step-1': 3 }, ['step-2'])).toBe(1);
      expect(completionOf(mockRoutine, { 'step-1': 1 }, ['step-2'])).toBe(1 / 3);
    });
  });

  describe('feedback metric resolution & thresholds', () => {
    it('resolves default feedback metric when routine omits custom metric', () => {
      const metric = resolveFeedbackMetric(mockRoutine);
      expect(metric.name).toBe(DEFAULT_FEEDBACK_METRIC.name);
      expect(metric.escalationThreshold).toBe(DEFAULT_FEEDBACK_METRIC.escalationThreshold);
    });

    it('resolves custom feedback metric when defined on routine', () => {
      const customRoutine: Routine = {
        ...mockRoutine,
        feedbackMetric: {
          name: 'GI distress',
          label: 'GI distress / gastric tolerance',
          eyebrow: 'tolerance',
          logTitle: 'distress',
          minLabel: '0 · none',
          maxLabel: '10 · severe',
          maxScore: 10,
          escalationThreshold: 3
        }
      };
      const metric = resolveFeedbackMetric(customRoutine);
      expect(metric.name).toBe('GI distress');
      expect(metric.escalationThreshold).toBe(3);
    });

    it('flags scores using default threshold (>= 4)', () => {
      expect(exceedsFeedbackThreshold(3)).toBe(false);
      expect(exceedsFeedbackThreshold(4)).toBe(true);
      expect(exceedsFeedbackThreshold(7)).toBe(true);
    });

    it('flags scores using custom threshold (e.g. >= 3 for GI distress)', () => {
      expect(exceedsFeedbackThreshold(2, 3)).toBe(false);
      expect(exceedsFeedbackThreshold(3, 3)).toBe(true);
      expect(exceedsFeedbackThreshold(5, 3)).toBe(true);
    });

    it('clamps scores to 0-10 range by default and respects custom max', () => {
      expect(clampFeedbackScore(-5)).toBe(0);
      expect(clampFeedbackScore(15)).toBe(10);
      expect(clampFeedbackScore(5)).toBe(5);
      expect(clampFeedbackScore(12, 8)).toBe(8);
    });
  });

  describe('isProgressionReady', () => {
    it('returns false if escalation is paused', () => {
      const logs: FeedbackLog[] = [
        { id: '1', day: 1, score: 0, note: '', loggedAt: '' },
        { id: '2', day: 2, score: 1, note: '', loggedAt: '' },
        { id: '3', day: 3, score: 0, note: '', loggedAt: '' }
      ];
      expect(isProgressionReady(logs, true)).toBe(false);
    });

    it('returns false if fewer than 3 logs exist', () => {
      const logs: FeedbackLog[] = [
        { id: '1', day: 1, score: 0, note: '', loggedAt: '' },
        { id: '2', day: 2, score: 1, note: '', loggedAt: '' }
      ];
      expect(isProgressionReady(logs, false)).toBe(false);
    });

    it('returns true when last 3 logs are under progression feedback threshold (<= 2)', () => {
      const logs: FeedbackLog[] = [
        { id: '1', day: 1, score: 1, note: '', loggedAt: '' },
        { id: '2', day: 2, score: 0, note: '', loggedAt: '' },
        { id: '3', day: 3, score: 1, note: '', loggedAt: '' }
      ];
      expect(isProgressionReady(logs, false)).toBe(true);
    });

    it('returns false when any of the last 3 logs is >= 2 with default threshold', () => {
      const logs: FeedbackLog[] = [
        { id: '1', day: 1, score: 1, note: '', loggedAt: '' },
        { id: '2', day: 2, score: 2, note: '', loggedAt: '' },
        { id: '3', day: 3, score: 0, note: '', loggedAt: '' }
      ];
      expect(isProgressionReady(logs, false)).toBe(false);
    });

    it('supports custom progression thresholds (e.g. < 3 allows score of 2)', () => {
      const logs: FeedbackLog[] = [
        { id: '1', day: 1, score: 1, note: '', loggedAt: '' },
        { id: '2', day: 2, score: 2, note: '', loggedAt: '' },
        { id: '3', day: 3, score: 2, note: '', loggedAt: '' }
      ];
      expect(isProgressionReady(logs, false, 3)).toBe(true);
      expect(isProgressionReady(logs, false, 2)).toBe(false);
    });
  });

  describe('complianceLevel & progressionStatus', () => {
    it('categorizes adherence rates correctly', () => {
      expect(complianceLevel(90)).toBe('high');
      expect(complianceLevel(75)).toBe('moderate');
      expect(complianceLevel(50)).toBe('low');
    });

    it('derives progressionStatus correctly', () => {
      expect(progressionStatus(true, false)).toBe('paused');
      expect(progressionStatus(false, true)).toBe('ready');
      expect(progressionStatus(false, false)).toBe('holding');
    });
  });

  describe('isRoutineCompleted', () => {
    it('returns false for null or undefined routine', () => {
      expect(isRoutineCompleted(null)).toBe(false);
      expect(isRoutineCompleted(undefined)).toBe(false);
    });

    it('returns false if totalDays is zero or negative', () => {
      expect(isRoutineCompleted({ currentDay: 5, totalDays: 0 })).toBe(false);
      expect(isRoutineCompleted({ currentDay: 5, totalDays: -1 })).toBe(false);
    });

    it('returns false if currentDay is less than totalDays', () => {
      expect(isRoutineCompleted({ currentDay: 1, totalDays: 14 }, false)).toBe(false);
      expect(isRoutineCompleted({ currentDay: 1, totalDays: 14 }, true)).toBe(false);
      expect(isRoutineCompleted({ currentDay: 13, totalDays: 14 }, true)).toBe(false);
    });

    it('returns false if on final day but today is not complete', () => {
      expect(isRoutineCompleted({ currentDay: 14, totalDays: 14 }, false)).toBe(false);
    });

    it('returns true if on final day and today is complete', () => {
      expect(isRoutineCompleted({ currentDay: 14, totalDays: 14 }, true)).toBe(true);
    });

    it('returns true if currentDay exceeds totalDays', () => {
      expect(isRoutineCompleted({ currentDay: 15, totalDays: 14 }, false)).toBe(true);
      expect(isRoutineCompleted({ currentDay: 15, totalDays: 14 }, true)).toBe(true);
    });

    it('returns true if recorded dayHistory count meets or exceeds totalDays', () => {
      const history = new Array(14).fill(1);
      expect(isRoutineCompleted({ currentDay: 14, totalDays: 14, dayHistory: history }, false)).toBe(true);
    });
  });

  describe('resolveBiomarkerPoints, resolveFieldTargetBounds & resolveMilestoneDays', () => {
    const numericField: DataCollectionField = {
      id: 'ach-dorsiflexion',
      name: 'Ankle Dorsiflexion Angle',
      label: 'Weight-Bearing Lunge Dorsiflexion',
      type: 'numeric',
      frequency: 'weekly',
      unit: '°',
      min: 0,
      max: 45,
      targetMin: 35,
      targetMax: 45
    };

    const scaleField: DataCollectionField = {
      id: 'ach-pain-vas',
      name: 'Tendon Discomfort',
      label: 'Tendon Discomfort (VAS 0–10)',
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: 10,
      step: 1,
      escalationThreshold: 4
    };

    it('returns empty array when user has 0 logs instead of generating fake progression points', () => {
      expect(resolveBiomarkerPoints(numericField, [], [])).toEqual([]);
      expect(resolveBiomarkerPoints(scaleField, [], [])).toEqual([]);
    });

    it('preserves a single logged data point on Day 1 without falling back to simulated data', () => {
      const logs: MorphingDataLog[] = [
        { id: 'm-1', fieldId: 'ach-dorsiflexion', day: 1, value: 28, loggedAt: '9:00 AM' }
      ];
      expect(resolveBiomarkerPoints(numericField, logs, [])).toEqual([{ day: 1, value: 28 }]);
    });

    it('deduplicates same-day readings by keeping the latest entry and sorts chronologically', () => {
      const logs: MorphingDataLog[] = [
        { id: 'm-2', fieldId: 'ach-dorsiflexion', day: 7, value: 34, loggedAt: '9:00 AM' },
        { id: 'm-1', fieldId: 'ach-dorsiflexion', day: 1, value: 26, loggedAt: '8:00 AM' },
        { id: 'm-3', fieldId: 'ach-dorsiflexion', day: 1, value: 29, loggedAt: '6:00 PM' }
      ];
      expect(resolveBiomarkerPoints(numericField, logs, [])).toEqual([
        { day: 1, value: 29 },
        { day: 7, value: 34 }
      ]);
    });

    it('falls back to feedbackLogs for scale fields when morphingLogs are empty', () => {
      const feedback: FeedbackLog[] = [
        { id: 'f-1', day: 1, score: 2, note: '', loggedAt: '8:00 AM' },
        { id: 'f-2', day: 2, score: 1, note: '', loggedAt: '8:00 AM' }
      ];
      expect(resolveBiomarkerPoints(scaleField, [], feedback)).toEqual([
        { day: 1, value: 2 },
        { day: 2, value: 1 }
      ]);
    });

    it('resolves explicit targetMin/targetMax or derives safe range from escalationThreshold', () => {
      expect(resolveFieldTargetBounds(numericField)).toEqual({ targetMin: 35, targetMax: 45 });
      expect(resolveFieldTargetBounds(scaleField)).toEqual({ targetMin: 0, targetMax: 3 });
    });

    it('clips milestone days to routine totalDays and derives sensible defaults when omitted', () => {
      const photoField: DataCollectionField = {
        id: 'photo-1',
        name: 'Posture Photo',
        label: 'Posture Photo',
        type: 'photo',
        frequency: 'milestone',
        milestoneDays: [1, 14, 30, 84]
      };
      expect(resolveMilestoneDays(photoField, 30)).toEqual([1, 14, 30]);
      expect(resolveMilestoneDays({ ...photoField, milestoneDays: undefined }, 14)).toEqual([1, 7, 14]);
    });
  });
});
