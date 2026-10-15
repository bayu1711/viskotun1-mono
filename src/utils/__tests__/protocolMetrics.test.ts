import { describe, expect, it } from 'vitest';
import { DEFAULT_FEEDBACK_METRIC } from '../../data/config';
import type { FeedbackLog, Protocol } from '../../types/protocol';
import {
  adherenceOf,
  clampFeedbackScore,
  clampPainScore,
  completionOf,
  complianceLevel,
  exceedsFeedbackThreshold,
  exceedsPainThreshold,
  isProgressionReady,
  progressionStatus,
  resolveFeedbackMetric
} from '../protocolMetrics';

const mockProtocol: Protocol = {
  id: 'test-protocol',
  title: 'Test Protocol',
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
    { id: 'rule-1', condition: 'pain < 2', action: 'increase load' }
  ],
  contraindications: [
    { id: 'c-1', text: 'stop on sharp pain', severity: 'stop' }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  initialFeedbackLogs: [],
  initialPainLogs: [],
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

describe('protocolMetrics', () => {
  describe('adherenceOf', () => {
    it('accurately calculates day 1 adherence without exceeding 100%', () => {
      const day1Protocol: Protocol = {
        ...mockProtocol,
        currentDay: 1,
        dayHistory: []
      };

      expect(adherenceOf(day1Protocol, 0)).toBe(0);
      expect(adherenceOf(day1Protocol, 0.5)).toBe(50);
      expect(adherenceOf(day1Protocol, 1)).toBe(100);
    });

    it('safely handles past dayHistory without double-counting today', () => {
      const day4Protocol: Protocol = {
        ...mockProtocol,
        currentDay: 4,
        dayHistory: [1, 0.67, 1] // 3 past days
      };

      // (1 + 0.67 + 1 + 1) / 4 = 3.67 / 4 = 0.9175 -> 92%
      expect(adherenceOf(day4Protocol, 1)).toBe(92);
      // (1 + 0.67 + 1 + 0) / 4 = 2.67 / 4 = 0.6675 -> 67%
      expect(adherenceOf(day4Protocol, 0)).toBe(67);
    });

    it('clamps adherence to 100% even if extra days exist in history', () => {
      const overflowProtocol: Protocol = {
        ...mockProtocol,
        currentDay: 2,
        dayHistory: [1, 1, 1, 1] // Malformed excessive history
      };

      expect(adherenceOf(overflowProtocol, 1)).toBe(100);
    });

    it('returns 0 if currentDay is 0 or negative', () => {
      const zeroProtocol: Protocol = {
        ...mockProtocol,
        currentDay: 0,
        dayHistory: []
      };
      expect(adherenceOf(zeroProtocol, 1)).toBe(0);
    });
  });

  describe('completionOf', () => {
    it('calculates ratio of completed sets across steps', () => {
      // Total sets = 3 (step-1) + 2 (step-2) = 5
      expect(completionOf(mockProtocol, {})).toBe(0);
      expect(completionOf(mockProtocol, { 'step-1': 3, 'step-2': 2 })).toBe(1);
      expect(completionOf(mockProtocol, { 'step-1': 1, 'step-2': 1 })).toBe(2 / 5);
    });

    it('clamps setsDone per step so it never exceeds step.sets', () => {
      expect(completionOf(mockProtocol, { 'step-1': 10, 'step-2': 10 })).toBe(1);
    });
  });

  describe('feedback metric resolution & thresholds', () => {
    it('resolves default feedback metric when protocol omits custom metric', () => {
      const metric = resolveFeedbackMetric(mockProtocol);
      expect(metric.name).toBe(DEFAULT_FEEDBACK_METRIC.name);
      expect(metric.escalationThreshold).toBe(DEFAULT_FEEDBACK_METRIC.escalationThreshold);
    });

    it('resolves custom feedback metric when defined on protocol', () => {
      const customProtocol: Protocol = {
        ...mockProtocol,
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
      const metric = resolveFeedbackMetric(customProtocol);
      expect(metric.name).toBe('GI distress');
      expect(metric.escalationThreshold).toBe(3);
    });

    it('flags scores using default threshold (>= 4)', () => {
      expect(exceedsPainThreshold(3)).toBe(false);
      expect(exceedsPainThreshold(4)).toBe(true);
      expect(exceedsPainThreshold(7)).toBe(true);
    });

    it('flags scores using custom threshold (e.g. >= 3 for GI distress)', () => {
      expect(exceedsFeedbackThreshold(2, 3)).toBe(false);
      expect(exceedsFeedbackThreshold(3, 3)).toBe(true);
      expect(exceedsFeedbackThreshold(5, 3)).toBe(true);
    });

    it('clamps scores to 0-10 range by default and respects custom max', () => {
      expect(clampPainScore(-5)).toBe(0);
      expect(clampPainScore(15)).toBe(10);
      expect(clampPainScore(5)).toBe(5);
      expect(clampPainScore(12, 8)).toBe(8);
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

    it('returns true when last 3 logs are under progression pain threshold (< 2)', () => {
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
});
