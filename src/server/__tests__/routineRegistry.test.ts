import { describe, expect, it } from 'vitest';
import {
  findCanonicalRoutine,
  saveCanonicalRoutine,
  getCommunityReviews,
  addCommunityReview,
  getCommunityMetrics
} from '../routineRegistry';
import type { Routine } from '../../types/routine';

describe('routineRegistry', () => {
  it('locates built-in canonical routines by preset ID and DOI', async () => {
    const achilles = await findCanonicalRoutine({ id: 'achilles' });
    expect(achilles).not.toBeNull();
    expect(achilles?.id).toBe('achilles');

    const byDoi = await findCanonicalRoutine({ doi: '10.1016/j.jsr.2023.04.017' });
    expect(byDoi).not.toBeNull();
    expect(byDoi?.id).toBe('achilles');
  });

  it('deduplicates routine when saved twice, returning the canonical instance', async () => {
    const mockRoutine: Routine = {
      id: 'custom-sleep-trial-routine',
      title: 'Sleep Optimization Trial Routine',
      shortTitle: 'sleep trial',
      icon: 'sleep',
      phase: 'Phase 1',
      phaseLabel: 'week 1',
      totalDays: 14,
      currentDay: 1,
      streak: 1,
      paper: {
        title: 'Sleep Optimization Trial Routine',
        fileName: 'sleep-routine.pdf',
        authors: 'Smith et al.',
        year: 2025,
        journal: 'Sleep Health',
        doi: '10.1016/j.sleep.2025.01.999',
        sampleSize: 60,
        trialType: 'RCT',
        evidenceBadges: ['rct'],
        pages: 8
      },
      steps: [],
      progressionRules: [],
      contraindications: [],
      missingDataFlags: [],
      dayHistory: [],
      initialSetsDone: {},
      initialMessages: [],
      community: {
        studyEfficacy: 78,
        realWorldEfficacy: 70,
        userCount: 50,
        medianAdherence: 80,
        dropOffUnit: 'day',
        peakPeriod: 7,
        dropOff: [],
        insightLead: 'Day 7 dropoff',
        insightRest: 'keep going',
        reviews: [
          {
            id: 'rev-seed-routine-1',
            handle: 'Participant · 28M',
            day: 7,
            outcome: 'improved',
            text: 'Sleep latency dropped by 20 minutes.',
            adherence: 90
          }
        ]
      },
      faqs: []
    };

    // First save: creates new canonical routine
    const firstSave = await saveCanonicalRoutine(mockRoutine);
    expect(firstSave.isNew).toBe(true);
    expect(firstSave.protocol.isCanonical).toBe(true);

    // Second save with same DOI: deduplicates and returns existing entity
    const secondSave = await saveCanonicalRoutine(mockRoutine);
    expect(secondSave.isNew).toBe(false);
    expect(secondSave.protocol.id).toBe(firstSave.protocol.id);
  });

  it('records and returns community reviews for a routine', async () => {
    const reviewsBefore = await getCommunityReviews('achilles');
    expect(reviewsBefore.length).toBeGreaterThan(0);

    const newRev = await addCommunityReview('achilles', {
      outcome: 'improved',
      day: 8,
      adherence: 95,
      handle: 'Anonymous · 35M · Runner',
      text: 'Eccentric drops reduced morning stiffness noticeably.'
    });

    expect(newRev.id).toMatch(/^rev_/);
    expect(newRev.outcome).toBe('improved');

    const reviewsAfter = await getCommunityReviews('achilles');
    const found = reviewsAfter.find((r) => r.id === newRev.id);
    expect(found).toBeDefined();
    expect(found?.text).toBe('Eccentric drops reduced morning stiffness noticeably.');
  });

  it('retrieves community metrics for a canonical routine', async () => {
    const metrics = await getCommunityMetrics('achilles');
    expect(metrics).not.toBeNull();
    expect(metrics?.studyEfficacy).toBe(80);
    expect(metrics?.realWorldEfficacy).toBeGreaterThan(0);
  });
});
