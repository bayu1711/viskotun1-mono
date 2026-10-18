import { describe, expect, it } from 'vitest';
import {
  FALLBACK_CREATINE_SLEEP,
  FALLBACK_PATELLAR_REHAB,
  generateFallbackProtocol,
  isTheoreticalOrNonHuman
} from '../fallbackProtocols';

describe('Scientific Gatekeeper & Fallback Protocols', () => {
  describe('isTheoreticalOrNonHuman', () => {
    it('declines non-human animal models with educational reasoning', () => {
      const mouseCheck = isTheoreticalOrNonHuman('Effects of Metformin in Aging Mouse Models.pdf');
      expect(mouseCheck.declined).toBe(true);
      expect(mouseCheck.reason).toContain('Non-human / rodent model');

      const ratCheck = isTheoreticalOrNonHuman('Tendon Healing in Wistar Rat Achilles Model.pdf');
      expect(ratCheck.declined).toBe(true);
      expect(ratCheck.reason).toContain('Non-human / rodent model');
    });

    it('declines in vitro and cell culture studies', () => {
      const inVitroCheck = isTheoreticalOrNonHuman('In Vitro Collagen Synthesis in Tenocyte Cell Culture');
      expect(inVitroCheck.declined).toBe(true);
      expect(inVitroCheck.reason).toContain('In vitro / cell culture study');
    });

    it('declines theoretical physics, math, and cosmology', () => {
      const physicsCheck = isTheoreticalOrNonHuman('Quantum Gravitational Fluctuations in String Theory.pdf');
      expect(physicsCheck.declined).toBe(true);
      expect(physicsCheck.reason).toContain('Theoretical / non-human science');

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

  describe('generateFallbackProtocol', () => {
    it('returns Creatine protocol for cognitive or sleep sources', () => {
      const protocol = generateFallbackProtocol('Sleep_Deprivation_Cognition.pdf');
      expect(protocol.id).toBe(FALLBACK_CREATINE_SLEEP.id);
      expect(protocol.dayHistory).toEqual([]);
    });

    it('returns Patellar Rehab protocol for knee or tendinopathy sources', () => {
      const protocol = generateFallbackProtocol('Patellar_Tendon_Rehab.pdf');
      expect(protocol.id).toBe(FALLBACK_PATELLAR_REHAB.id);
      expect(protocol.dayHistory).toEqual([]);
    });

    it('creates a formatted fallback protocol with Day 1 empty history for custom papers', () => {
      const protocol = generateFallbackProtocol('Resistance_Training_In_Older_Adults.pdf');
      expect(protocol.title).toBe('Resistance Training In Older Adults');
      expect(protocol.currentDay).toBe(1);
      expect(protocol.dayHistory).toEqual([]);
      expect(protocol.steps.length).toBeGreaterThan(0);
    });
  });
});
