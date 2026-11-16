/**
 * Formal Behavior Change Techniques (BCT Taxonomy v1)
 * Grounded in Michie et al. (2013), Annals of Behavioral Medicine.
 *
 * Provides accredited behavioral medicine coding for all adaptive features,
 * micro-dosing protocols, and barrier mitigations in ViskotuN1.
 */

export interface BctTaxonomyEntry {
  code: string;
  cluster: string;
  name: string;
  description: string;
  viskotuImplementation: string;
  mechanismOfAction: string;
  targetBarriers: string[];
}

export interface HealthAgeProjection {
  chronologicalAge: number;
  projectedHealthAge: number;
  healthAgeDelta: number;
  relativeCVDDelta: number;
  relativeMetabolicDelta: number;
  habitResilienceScore: number;
  activeDaysCount: number;
  microDoseConversionCount: number;
  sustainedStreak: number;
  breakdown: {
    physicalMovementYears: number;
    circadianSleepYears: number;
    substanceHarmReductionYears: number;
  };
}
