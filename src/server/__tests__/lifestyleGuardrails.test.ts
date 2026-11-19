import { describe, expect, it } from 'vitest';
import { achillesRoutine } from '../../data/routines/achilles';
import {
  resolveCountryCodeFromInput,
  resolveCountryName,
  resolveRegionFromTimezone
} from '../../utils/geo';
import { BASELINE_GUARDRAIL_POLICY } from '../guardrailLedger';
import { generateLifestyleAdaptation } from '../lifestyleEngine';
import {
  containsUnsafeLifestyleGuidance,
  validateAdaptationWithGuardrails,
  validateRegionalTagsWithGuardrails
} from '../lifestyleGuardrails';

describe('Global Geo & Guardrail-Protected Adaptive Lifestyle Engine', () => {
  describe('global geo & timezone resolution', () => {
    it('maps global IANA timezones to ISO countries and cities worldwide', () => {
      expect(resolveRegionFromTimezone('Asia/Tokyo')).toEqual({
        countryCode: 'JP',
        countryName: 'Japan',
        city: 'Tokyo'
      });
      expect(resolveRegionFromTimezone('America/Sao_Paulo')).toEqual({
        countryCode: 'BR',
        countryName: 'Brazil',
        city: 'São Paulo'
      });
      expect(resolveRegionFromTimezone('Europe/Berlin')).toEqual({
        countryCode: 'DE',
        countryName: 'Germany',
        city: 'Berlin'
      });
    });

    it('resolves ISO-3166 country codes dynamically from free-text country names', () => {
      expect(resolveCountryCodeFromInput('Germany')).toBe('DE');
      expect(resolveCountryCodeFromInput('Japan')).toBe('JP');
      expect(resolveCountryCodeFromInput('Brazil')).toBe('BR');
      expect(resolveCountryCodeFromInput('United Arab Emirates')).toBe('AE');
      expect(resolveCountryName('JP')).toBe('Japan');
    });
  });

  describe('clinical safety guardrails for lifestyle tags & adaptations', () => {
    it('flags dangerous dosage inflation, pain override, and unsafe climate directives', () => {
      expect(containsUnsafeLifestyleGuidance('Double the sets tomorrow to catch up')).toBe(true);
      expect(containsUnsafeLifestyleGuidance('Push through sharp pain during heel drops')).toBe(true);
      expect(containsUnsafeLifestyleGuidance('Stop taking your medication before starting')).toBe(true);
      expect(containsUnsafeLifestyleGuidance('Exercise outdoors in midday heat')).toBe(true);
      expect(containsUnsafeLifestyleGuidance('Shift exertion to post-Iftar indoor cool hours')).toBe(false);
    });

    it('strips unsafe AI-derived regional tags and normalizes categories', () => {
      const cleaned = validateRegionalTagsWithGuardrails(
        [
          { label: 'Late-evening commuter standing', category: 'schedule' },
          { label: 'Double the dose after work', category: 'schedule' },
          { label: 'Late-evening commuter standing', category: 'culture' }, // duplicate
          { label: 'Cold winter warm-up need', category: 'environment' }
        ],
        'JP'
      );

      expect(cleaned).toHaveLength(2);
      expect(cleaned[0].countryCode).toBe('JP');
      expect(cleaned.map((t) => t.label)).not.toContain('Double the dose after work');
    });

    it('sanitizes unsafe adaptation payloads, filters unknown stepIds, and clamps compounding barriers to micro-dose', () => {
      const validStepId = achillesRoutine.steps[0].id;
      const result = validateAdaptationWithGuardrails(
        {
          bannerTitle: 'Tokyo Shift Pacing',
          bannerGuidance: 'Ignore sharp pain and double the reps to finish faster.',
          recommendedDoseMode: 'standard',
          suggestedWindow: 'Late morning indoor window',
          stepTips: {
            [validStepId]: 'Shift to post-shift rest window',
            'bogus-step-id': 'Should be stripped',
            [achillesRoutine.steps[1].id]: 'Push through sharp pain'
          },
          source: 'gemini-global-ai'
        },
        achillesRoutine,
        {
          region: {
            countryCode: 'JP',
            countryName: 'Japan',
            city: 'Tokyo',
            detectedBy: 'user_selected',
            confirmed: true
          },
          isRamadanFastingObserver: true,
          workPattern: 'shift_work',
          activeTags: ['ramadan_fasting', 'healthcare_shift_worker'],
          intakeCompleted: true
        },
        BASELINE_GUARDRAIL_POLICY
      );

      expect(result.guardrailVerified).toBe(true);
      expect(result.recommendedDoseMode).toBe('micro'); // clamped by compounding friction guardrail
      expect(result.bannerGuidance).not.toContain('Ignore sharp pain');
      expect(result.stepTips[validStepId]).toBe('Shift to post-shift rest window');
      expect(result.stepTips['bogus-step-id']).toBeUndefined();
      expect(result.stepTips[achillesRoutine.steps[1].id]).toBeUndefined();
      expect(result.safetyGuardrailNote).toContain(String(BASELINE_GUARDRAIL_POLICY.painEscalationThreshold));
    });
  });

  describe('generateLifestyleAdaptation deterministic fallback', () => {
    it('adapts routines sensibly for global profiles (e.g. cold Berlin shift worker or Dubai summer heat)', async () => {
      const berlinResult = await generateLifestyleAdaptation({
        userProfile: { age: 42, preferredReminderTime: '18:00' },
        lifestyleProfile: {
          region: {
            countryCode: 'DE',
            countryName: 'Germany',
            city: 'Berlin',
            detectedBy: 'client_timezone',
            confirmed: false
          },
          workPattern: 'shift_work',
          climateSensitivity: 'cold_climate',
          activeTags: ['healthcare_shift_worker'],
          intakeCompleted: true
        },
        routine: achillesRoutine
      });

      expect(berlinResult.guardrailVerified).toBe(true);
      expect(berlinResult.regionLabel).toBe('Berlin, Germany');
      expect(berlinResult.recommendedDoseMode).toBe('micro');
      expect(berlinResult.bannerGuidance.toLowerCase()).toContain('shift');
      expect(Object.keys(berlinResult.stepTips).length).toBeGreaterThan(0);

      const usLateDinnerResult = await generateLifestyleAdaptation({
        userProfile: { age: 35, preferredReminderTime: '21:30' },
        lifestyleProfile: {
          region: {
            countryCode: 'US',
            countryName: 'United States',
            city: 'New York',
            detectedBy: 'user_selected',
            confirmed: true
          },
          culturalRhythms: ['late_family_dinner', 'sabbath_weekly_rest'],
          workPattern: 'standard',
          intakeCompleted: true
        },
        routine: achillesRoutine
      });
      expect(usLateDinnerResult.guardrailVerified).toBe(true);
      expect(usLateDinnerResult.suggestedWindow).toContain('Post-dinner');
      expect(usLateDinnerResult.bannerGuidance.toLowerCase()).toContain('digestion');
    });
  });
});
