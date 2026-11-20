import { describe, expect, it } from 'vitest';
import { calculateHealthAgeProjection } from '../healthAgeEngine';
import { BCT_TAXONOMY_ENTRIES } from '../../data/bctTaxonomy';

describe('Health Age Projection Engine', () => {
  it('computes biological health age reduction for consistent adherence', () => {
    const projection = calculateHealthAgeProjection({
      adherenceRate: 85,
      streak: 14,
      currentDay: 14,
      totalDays: 28,
      chronologicalAge: 40
    });

    expect(projection.chronologicalAge).toBe(40);
    expect(projection.projectedHealthAge).toBeLessThan(40);
    expect(projection.healthAgeDelta).toBeLessThan(0);
    expect(projection.relativeCVDDelta).toBeLessThan(0);
    expect(projection.relativeMetabolicDelta).toBeLessThan(0);
    expect(projection.habitResilienceScore).toBeGreaterThan(50);
  });

  it('rewards barrier micro-dose conversion with higher habit resilience', () => {
    const withMicroDosing = calculateHealthAgeProjection({
      adherenceRate: 80,
      streak: 10,
      currentDay: 10,
      totalDays: 28,
      barrierCount: 4,
      microDoseCount: 4 // 100% conversion
    });

    const withoutMicroDosing = calculateHealthAgeProjection({
      adherenceRate: 80,
      streak: 10,
      currentDay: 10,
      totalDays: 28,
      barrierCount: 4,
      microDoseCount: 0 // 0% conversion
    });

    expect(withMicroDosing.habitResilienceScore).toBeGreaterThan(withoutMicroDosing.habitResilienceScore);
  });

  it('incorporates harm reduction years when Midwakh or tobacco tags are present', () => {
    const withTobacco = calculateHealthAgeProjection({
      adherenceRate: 90,
      streak: 21,
      currentDay: 21,
      totalDays: 42,
      activeTags: ['midwakh_dokha']
    });

    const withoutTobacco = calculateHealthAgeProjection({
      adherenceRate: 90,
      streak: 21,
      currentDay: 21,
      totalDays: 42,
      activeTags: []
    });

    expect(withTobacco.breakdown.substanceHarmReductionYears).toBeGreaterThan(0);
    expect(withoutTobacco.breakdown.substanceHarmReductionYears).toBe(0);
    expect(Math.abs(withTobacco.healthAgeDelta)).toBeGreaterThanOrEqual(
      Math.abs(withoutTobacco.healthAgeDelta)
    );
  });

  it('handles zero streak gracefully without fabricating a health age reduction or resilience score', () => {
    const zeroState = calculateHealthAgeProjection({
      adherenceRate: 0,
      streak: 0,
      currentDay: 1,
      totalDays: 28,
      chronologicalAge: 35
    });

    expect(zeroState.chronologicalAge).toBe(35);
    expect(zeroState.projectedHealthAge).toBe(35);
    expect(zeroState.healthAgeDelta).toBe(0);
    expect(zeroState.habitResilienceScore).toBe(0);
    expect(zeroState.sustainedStreak).toBe(0);
  });
});

describe('BCT Taxonomy v1 Specifications', () => {
  it('contains 10 accredited behavioral medicine techniques', () => {
    expect(BCT_TAXONOMY_ENTRIES.length).toBe(10);
  });

  it('includes key micro-dosing and non-punitive re-entry techniques', () => {
    const codes = BCT_TAXONOMY_ENTRIES.map((e) => e.code);
    expect(codes).toContain('BCT 1.1');
    expect(codes).toContain('BCT 1.2');
    expect(codes).toContain('BCT 8.7'); // Graded tasks / Adaptive micro-dosing
    expect(codes).toContain('BCT 11.2'); // Reduce negative emotions (non-punitive re-entry)
    expect(codes).toContain('BCT 8.1'); // Behavioral substitution (Midwakh & indoor thermal)
  });

  it('guarantees every BCT entry has an explicit mechanism of action', () => {
    for (const entry of BCT_TAXONOMY_ENTRIES) {
      expect(entry.mechanismOfAction.length).toBeGreaterThan(15);
      expect(entry.viskotuImplementation.length).toBeGreaterThan(15);
      expect(entry.targetBarriers.length).toBeGreaterThan(0);
    }
  });
});
