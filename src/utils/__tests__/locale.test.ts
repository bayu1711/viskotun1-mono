import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import {
  COPY_AR,
  COPY_EN,
  GULF_HEALTH_GLOSSARY,
  getLocaleCopy,
  mergeLocaleCopy
} from '../../data/locales';

describe('Bilingual Localization & Clinical Glossary', () => {
  describe('Gulf Clinical Glossary Standards', () => {
    it('contains all essential health and behavioral domain terms', () => {
      expect(GULF_HEALTH_GLOSSARY.length).toBeGreaterThanOrEqual(10);

      const englishTerms = GULF_HEALTH_GLOSSARY.map((t) => t.en);
      expect(englishTerms.some((t) => t.includes('Routine'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Streak'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Micro-Dose'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Midwakh'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Shisha'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Ramadan'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Heat'))).toBe(true);
      expect(englishTerms.some((t) => t.includes('Guardrail'))).toBe(true);
    });

    it('ensures each term has a verified clinical domain and justification', () => {
      for (const term of GULF_HEALTH_GLOSSARY) {
        expect(term.en).toBeTruthy();
        expect(term.ar).toBeTruthy();
        expect(term.clinicalDomain).toMatch(/^(behavior|clinical|regional|safety|ux)$/);
        expect(term.rationale.length).toBeGreaterThan(15);
      }
    });
  });

  describe('Locale Copy Dictionaries & Parity', () => {
    it('returns English copy for en locale', () => {
      const copy = getLocaleCopy('en');
      expect(copy.nav.today).toBe('Today');
      expect(copy.reEntry.badge).toBe('Adaptive Re-Entry');
      expect(copy.metadata.lang).toBe('en');
    });

    it('returns Arabic copy for ar locale with clinical terminology', () => {
      const copy = getLocaleCopy('ar');
      expect(copy.nav.today).toBe('اليوم');
      expect(copy.metadata.lang).toBe('ar');
      expect(copy.reEntry.badge).toBe('مرحباً بعودتك');
      expect(copy.reEntry.title).toContain('استئناف');
      expect(copy.doseMode.micro).toContain('خطوة ميسّرة');
      expect(copy.reEntry.doseModes.micro.title).toContain('الخطوة الميسّرة');
      expect(copy.lifestyleTuning.title).toContain('الملف السلوكي');
      expect(copy.safety.clinicalDisclaimer).toContain('تنويه طبي سريري');
      expect(copy.safety.clinicalDisclaimer).toContain('TrialN1');
    });

    it('guarantees 100% top-level key parity between English and Arabic', () => {
      const enKeys = Object.keys(COPY_EN);
      const arKeys = Object.keys(COPY_AR);

      for (const key of enKeys) {
        expect(arKeys).toContain(key);
        expect((COPY_AR as Record<string, unknown>)[key]).toBeDefined();
      }
    });

    it('formats parametric functions correctly in Arabic', () => {
      expect(COPY_AR.common.percentComplete(85)).toBe('اكتمل بنسبة 85%');
      expect(COPY_AR.routine.eyebrow(3, 14)).toBe('اليوم 3 من 14');
      expect(COPY_AR.shell.streak(1)).toContain('يوم التزام واحد');
      expect(COPY_AR.shell.streak(5)).toContain('5 أيام التزام');
    });
  });

  describe('mergeLocaleCopy', () => {
    it('preserves target keys while overriding localized properties', () => {
      const base = { ...COPY } as any;
      const merged = mergeLocaleCopy(base, {
        nav: { today: 'اليوم' }
      } as any);

      expect(merged.nav.today).toBe('اليوم');
      expect(merged.nav.stats).toBe(base.nav.stats);
      expect(merged.nav.community).toBe(base.nav.community);
    });
  });
});
