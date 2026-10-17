import { describe, it, expect } from 'vitest';
import { getDynamicSuggestions, hasQuestionBeenAsked } from '../suggestions';
import type { Routine, ChatMessage } from '../../types/routine';

const mockProtocol: Routine = {
  id: 'mock-1',
  title: 'Achilles Tendinopathy Protocol',
  shortTitle: 'Achilles Loading',
  icon: 'walk',
  phase: 'Phase 1',
  phaseLabel: 'Eccentric Phase',
  totalDays: 84,
  currentDay: 5,
  streak: 5,
  paper: {
    title: 'Eccentric Training in Achilles Tendinopathy',
    authors: 'Alfredson H, et al.',
    journal: 'Am J Sports Med',
    year: 1998,
    doi: '10.1177/03635465980260030301',
    sampleSize: 15,
    trialType: 'Prospective Clinical Cohort'
  },
  steps: [
    {
      id: 'step-1',
      tone: 'mint',
      icon: 'walk',
      action: 'Eccentric Heel Drop',
      detail: 'Lower slowly on straight knee',
      sets: 3,
      reps: 15,
      frequency: '2x Daily'
    }
  ],
  progressionRules: [
    {
      condition: 'Pain < 2/10 for 3 days',
      action: 'Add 5% load'
    }
  ],
  contraindications: [
    {
      severity: 'stop',
      text: 'Acute sharp pain'
    }
  ],
  missingDataFlags: [],
  dayHistory: [],
  initialSetsDone: {},
  initialMessages: [],
  community: {
    studyEfficacy: 80,
    realWorldEfficacy: 25,
    userCount: 4,
    medianAdherence: 68,
    dropOffUnit: 'day',
    peakPeriod: 7,
    dropOff: [],
    insightLead: 'High efficacy',
    insightRest: 'Strict adherence',
    reviews: []
  },
  faqs: [
    {
      question: 'why 3 × 15 reps?',
      keywords: ['rep', 'set'],
      answer: 'The trial prescribed 3 sets of 15 reps twice daily.'
    },
    {
      question: 'is some discomfort okay?',
      keywords: ['pain', 'discomfort'],
      answer: 'Yes, mild discomfort up to 3/10 is acceptable.'
    },
    {
      question: 'when do I add load?',
      keywords: ['progress', 'load'],
      answer: 'Add 5kg once discomfort is under 2/10 for 3 days.'
    }
  ],
  feedbackMetric: {
    name: 'Discomfort',
    label: 'Discomfort scale 0-10',
    escalationThreshold: 4
  }
};

describe('hasQuestionBeenAsked', () => {
  it('returns false when question has not been asked', () => {
    expect(hasQuestionBeenAsked('why 3 × 15 reps?', ['can I drink coffee?'])).toBe(false);
  });

  it('detects exact question matches', () => {
    expect(hasQuestionBeenAsked('why 3 × 15 reps?', ['why 3 × 15 reps?'])).toBe(true);
  });

  it('detects normalized question matches ignoring case and punctuation', () => {
    expect(hasQuestionBeenAsked('why 3 × 15 reps?', ['Why 3 x 15 reps'])).toBe(true);
  });
});

describe('getDynamicSuggestions', () => {
  it('returns initial protocol FAQs when no questions have been asked yet', () => {
    const suggestions = getDynamicSuggestions(mockProtocol, []);
    expect(suggestions).toContain('why 3 × 15 reps?');
    expect(suggestions).toContain('is some discomfort okay?');
    expect(suggestions).toContain('when do I add load?');
  });

  it('removes asked questions from the returned suggestions', () => {
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        kind: 'text',
        content: 'why 3 × 15 reps?',
        timestamp: '10:00'
      },
      {
        id: 'msg-2',
        role: 'ai',
        kind: 'answer',
        content: 'The trial prescribed 3 sets of 15 reps twice daily.',
        timestamp: '10:00'
      }
    ];

    const suggestions = getDynamicSuggestions(mockProtocol, messages);
    // Asked question MUST NOT be in suggestions
    expect(suggestions).not.toContain('why 3 × 15 reps?');
    // Remaining unasked FAQs must still be present
    expect(suggestions).toContain('is some discomfort okay?');
    expect(suggestions).toContain('when do I add load?');
  });

  it('generates contextual follow-ups based on the AI response topic', () => {
    const messages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        kind: 'text',
        content: 'Tell me about the sets and reps',
        timestamp: '10:00'
      },
      {
        id: 'msg-2',
        role: 'ai',
        kind: 'answer',
        content: 'The routine requires 3 sets of 15 reps twice daily.',
        timestamp: '10:00'
      }
    ];

    const suggestions = getDynamicSuggestions(mockProtocol, messages);
    // When sets/reps were discussed, progression criteria is suggested as a follow-up
    expect(suggestions.some((s) => s.includes('progress'))).toBe(true);
  });

  it('provides new follow-up questions when all initial FAQs have been asked', () => {
    const messages: ChatMessage[] = [
      { id: '1', role: 'user', kind: 'text', content: 'why 3 × 15 reps?', timestamp: '10:00' },
      { id: '2', role: 'ai', kind: 'answer', content: '3x15 reps volume.', timestamp: '10:00' },
      { id: '3', role: 'user', kind: 'text', content: 'is some discomfort okay?', timestamp: '10:01' },
      { id: '4', role: 'ai', kind: 'answer', content: 'Mild discomfort up to 3/10 is fine.', timestamp: '10:01' },
      { id: '5', role: 'user', kind: 'text', content: 'when do I add load?', timestamp: '10:02' },
      { id: '6', role: 'ai', kind: 'answer', content: 'Add load when pain is below 2/10.', timestamp: '10:02' }
    ];

    const suggestions = getDynamicSuggestions(mockProtocol, messages);
    // All 3 FAQs have been asked, so none of them should appear
    expect(suggestions).not.toContain('why 3 × 15 reps?');
    expect(suggestions).not.toContain('is some discomfort okay?');
    expect(suggestions).not.toContain('when do I add load?');
    // Follow-ups (e.g. biofeedback tracking or safety or citation) should be populated
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('returns empty array when protocol is undefined', () => {
    expect(getDynamicSuggestions(undefined, [])).toEqual([]);
  });
});
