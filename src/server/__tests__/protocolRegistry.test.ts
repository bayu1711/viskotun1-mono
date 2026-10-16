import { describe, expect, it } from 'vitest';
import {
  findCanonicalProtocol,
  saveCanonicalProtocol,
  getCommunityReviews,
  addCommunityReview,
  getCommunityMetrics
} from '../protocolRegistry';
import type { Protocol } from '../../types/routine';

describe('protocolRegistry', () => {
  it('locates built-in canonical protocols by preset ID and DOI', async () => {
    const achilles = await findCanonicalProtocol({ id: 'achilles' });
    expect(achilles).not.toBeNull();
    expect(achilles?.id).toBe('achilles');

    const byDoi = await findCanonicalProtocol({ doi: '10.1016/j.jsr.2023.04.017' });
    expect(byDoi).not.toBeNull();
    expect(byDoi?.id).toBe('achilles');
  });

  it('deduplicates protocol when saved twice, returning the canonical instance', async () => {
    const mockProtocol: Protocol = {
      id: 'custom-sleep-trial',
      title: 'Sleep Optimization Trial',
      shortTitle: 'sleep trial',
      icon: 'sleep',
      phase: 'Phase 1',
      phaseLabel: 'week 1',
      totalDays: 14,
      currentDay: 1,
      streak: 1,
      paper: {
        title: 'Sleep Optimization Trial',
        fileName: 'sleep.pdf',
        authors: 'Smith et al.',
        year: 2025,
        journal: 'Sleep Health',
        doi: '10.1016/j.sleep.2025.01.001',
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
            id: 'rev-seed-1',
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

    // First save: creates new canonical protocol
    const firstSave = await saveCanonicalProtocol(mockProtocol);
    expect(firstSave.isNew).toBe(true);
    expect(firstSave.protocol.isCanonical).toBe(true);

    // Second save with same DOI: deduplicates and returns existing entity
    const secondSave = await saveCanonicalProtocol(mockProtocol);
    expect(secondSave.isNew).toBe(false);
    expect(secondSave.protocol.id).toBe(firstSave.protocol.id);
  });

  it('records and returns community reviews for a protocol', async () => {
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

  it('retrieves community metrics for a canonical protocol', async () => {
    const metrics = await getCommunityMetrics('achilles');
    expect(metrics).not.toBeNull();
    expect(metrics?.studyEfficacy).toBe(80);
    expect(metrics?.realWorldEfficacy).toBeGreaterThan(0);
  });
});
