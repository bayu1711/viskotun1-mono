import { describe, expect, it } from 'vitest';
import {
  FALLBACK_CREATINE_SLEEP,
  FALLBACK_PATELLAR_REHAB,
  generateFallbackRoutine,
  isTheoreticalOrNonHuman
} from '../fallbackRoutines';

describe('Scientific Gatekeeper & Fallback Routines', () => {
  describe('isTheoreticalOrNonHuman', () => {
    it('declines non-human animal models with educational reasoning', () => {
      const mouseCheck = isTheoreticalOrNonHuman('Effects of Metformin in Aging Mouse Models.pdf');
      expect(mouseCheck.declined).toBe(true);
      expect(mouseCheck.reason).toContain('Non-human animal or in-vitro study');

      const ratCheck = isTheoreticalOrNonHuman('Tendon Healing in Wistar Rat Achilles Model.pdf');
      expect(ratCheck.declined).toBe(true);
      expect(ratCheck.reason).toContain('Non-human animal or in-vitro study');
    });

    it('declines in vitro and cell culture studies', () => {
      const inVitroCheck = isTheoreticalOrNonHuman('In Vitro Collagen Synthesis in Tenocyte Cell Culture');
      expect(inVitroCheck.declined).toBe(true);
      expect(inVitroCheck.reason).toContain('in-vitro study');
    });

    it('declines theoretical physics, math, and cosmology', () => {
      const physicsCheck = isTheoreticalOrNonHuman('Quantum Gravitational Fluctuations in String Theory.pdf');
      expect(physicsCheck.declined).toBe(true);
      expect(physicsCheck.reason).toContain('Theoretical physics');

      const mathCheck = isTheoreticalOrNonHuman('Topology of High-Dimensional Manifolds and Pure Math');
      expect(mathCheck.declined).toBe(true);
      expect(mathCheck.reason).toContain('mathematics');
    });

    it('approves interventional human scientific studies', () => {
      const rehabCheck = isTheoreticalOrNonHuman('Eccentric Loading for Mid-Portion Achilles Tendinopathy RCT.pdf');
      expect(rehabCheck.declined).toBe(false);

      const sleepCheck = isTheoreticalOrNonHuman('Creatine Supplementation During Acute Sleep Deprivation in Healthy Adults.pdf');
      expect(sleepCheck.declined).toBe(false);

      const hairCheck = isTheoreticalOrNonHuman('Microneedling Combined with Minoxidil in Androgenetic Alopecia Clinical Trial.pdf');
      expect(hairCheck.declined).toBe(false);
    });
  });

  describe('generateFallbackRoutine', () => {
    it('returns Creatine routine for cognitive or sleep sources', () => {
      const routine = generateFallbackRoutine('Sleep_Deprivation_Cognition.pdf');
      expect(routine.id).toBe(FALLBACK_CREATINE_SLEEP.id);
      expect(routine.dayHistory).toEqual([]);
    });

    it('returns Patellar Rehab routine for knee or tendinopathy sources', () => {
      const routine = generateFallbackRoutine('Patellar_Tendon_Rehab.pdf');
      expect(routine.id).toBe(FALLBACK_PATELLAR_REHAB.id);
      expect(routine.dayHistory).toEqual([]);
    });

    it('falls back to custom titled routine for general interventional papers', () => {
      const routine = generateFallbackRoutine('Isometric Quadriceps Strengthening in Patellofemoral Pain.pdf');
      expect(routine.id).toContain('isometric');
      expect(routine.title).toContain('Isometric Quadriceps');
      expect(routine.steps.length).toBeGreaterThan(0);
      expect(routine.paper.title).toContain('Isometric Quadriceps');
    });

    it('includes required missing parameter tags and adaptive safe defaults', () => {
      const routine = generateFallbackRoutine('Novel Resistance Protocol.pdf');
      expect(routine.paper.evidenceBadges).toContain('missing-parameters');
      expect(routine.steps[0].statLabel).toBeDefined();
    });
  });
});
