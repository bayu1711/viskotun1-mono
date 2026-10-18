import { describe, expect, it, vi } from 'vitest';

vi.mock('../guardrailLedger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../guardrailLedger')>();
  return { ...actual, getEffectiveGuardrails: async () => actual.BASELINE_GUARDRAIL_POLICY };
});

import { COPY } from '../../data/copy';
import type { Routine } from '../../types/routine';
import { findCalibratedRoutine } from '../calibratedRoutines';
import { extractPaperProtocol } from '../geminiExtraction';
import { findCanonicalRoutine } from '../routineRegistry';

async function extract(text: string): Promise<Routine> {
  const result = await extractPaperProtocol({ text });
  expect(result.eligible).toBe(true);
  expect(result.routine).toBeDefined();
  return result.routine!;
}

const field = (routine: Routine, id: string) => routine.dataCollectionSpec?.find((f) => f.id === id);

describe('calibrated paper lookup', () => {
  it.each([
    ['10.1111/sms.12313', 'plantar-fasciitis'],
    ['https://doi.org/10.1161/JAHA.121.020982', 'imst-blood-pressure'],
    ['doi: 10.1016/j.smrv.2019.04.008', 'warm-bath-sleep'],
    ['10.1179/106698105790824888', 'cervical-posture'],
    ['10.4103/0253-7176.106022', 'ashwagandha-stress'],
    ['10.1073/pnas.0801268105', 'dual-n-back']
  ])('resolves DOI %s to %s', (doi, id) => {
    expect(findCalibratedRoutine(doi)?.id).toBe(id);
  });

  it('returns null for unknown papers', () => {
    expect(findCalibratedRoutine('Eccentric Loading for Mid-Portion Achilles Tendinopathy')).toBeNull();
  });

  it('registers each calibrated routine as a canonical built-in', async () => {
    const byDoi = await findCanonicalRoutine({ doi: '10.1111/sms.12313' });
    expect(byDoi?.id).toBe('plantar-fasciitis');
  });
});

describe('QA TC-01 · Plantar fasciitis (Rathleff 2015)', () => {
  it('is approved and renders the 3-2-3s tempo on step 1', async () => {
    const routine = await extract(
      'High-load strength training improves outcome in patients with plantar fasciitis: A randomized controlled trial with 12-month follow-up'
    );
    expect(routine.id).toBe('plantar-fasciitis');
    expect(routine.steps[0].tempo).toBe('3s up · 2s hold · 3s down');
    expect(routine.steps[0].statValue).toBe('3-2-3s');
  });

  it('flags the omitted rest interval with an ACSM guideline provenance', async () => {
    const routine = await extract('10.1111/sms.12313');
    const step = routine.steps[0];
    expect(step.inferred).toBe(true);
    expect(step.inferredProvenance?.tier).toBe('guideline');
    expect(step.inferredProvenance?.source).toContain('ACSM Clinical Baseline: 2 min rest');
    expect(routine.missingDataFlags[0].sourceGuideline).toContain('ACSM');
  });

  it('has exactly 3 sets so the ring moves in thirds', async () => {
    const routine = await extract('10.1111/sms.12313');
    expect(routine.steps.reduce((sum, s) => sum + s.sets, 0)).toBe(3);
  });

  it('escalates first-step pain ≥ 4 with the 20% load reduction alert', async () => {
    const routine = await extract('10.1111/sms.12313');
    expect(routine.feedbackMetric?.escalationThreshold).toBe(4);
    expect(routine.feedbackMetric?.escalationMessage).toBe(COPY.safety.baselineEscalationAlert);
    expect(COPY.safety.baselineEscalationAlert).toContain('Pain threshold exceeded (≥ 4/10). Escalation paused.');
    expect(COPY.safety.baselineEscalationAlert).toContain('Reduce load by 20% tomorrow');
  });
});

describe('QA TC-02 · IMST (Craighead 2021)', () => {
  it('shows 30 breaths at 75% PImax as 1 session', async () => {
    const routine = await extract('10.1161/JAHA.121.020982');
    const step = routine.steps[0];
    expect(step.perSetLabel).toBe('× 30 breaths at 75% PImax');
    expect(step.sets).toBe(1);
    expect(step.setLabel).toBe('session');
  });

  it('collects systolic BP with a bounded numeric stepper and a 5-minute countdown', async () => {
    const routine = await extract('10.1161/JAHA.121.020982');
    const sbp = field(routine, 'imst-sbp');
    expect(sbp?.type).toBe('numeric');
    expect(sbp?.unit).toBe('mmHg');
    expect(sbp?.min).toBeLessThan(128);
    expect(sbp?.max).toBeGreaterThan(128);
    expect(sbp?.max).toBeLessThan(350);
    expect(sbp?.escalationThreshold).toBeUndefined();

    const timer = field(routine, 'imst-session-timer');
    expect(timer?.timerMode).toBe('countdown');
    expect(timer?.max).toBe(300);
  });

  it('keeps the dizziness advice (check BP, 50% resistance) under the policy', async () => {
    const routine = await extract('10.1161/JAHA.121.020982');
    expect(routine.feedbackMetric?.escalationThreshold).toBe(4);
    expect(routine.feedbackMetric?.escalationMessage).toContain('check your blood pressure');
    expect(routine.feedbackMetric?.escalationMessage).toContain('50% PImax');
  });
});

describe('QA TC-03 · Warm bath sleep (Haghayegh 2019)', () => {
  it('extracts the 15-minute bath and the 90-minute cooldown buffer', async () => {
    const routine = await extract(
      'Before-bedtime passive water heating by warm shower or bath to improve sleep: A systematic review and meta-analysis'
    );
    expect(routine.id).toBe('warm-bath-sleep');
    expect(routine.steps[0].durationSeconds).toBe(900);
    expect(routine.steps[0].statValue).toBe('40.0–42.5°C');
    expect(routine.steps[1].durationSeconds).toBe(5400);
  });

  it('has a bath countdown, a latency input and morning alertness choices', async () => {
    const routine = await extract('10.1016/j.smrv.2019.04.008');
    expect(field(routine, 'wb-bath-timer')).toMatchObject({ type: 'timer', timerMode: 'countdown', max: 900 });
    expect(field(routine, 'wb-sleep-latency')).toMatchObject({ type: 'numeric', unit: 'min' });
    expect(field(routine, 'wb-morning-alertness')?.options).toEqual(['Refreshed', 'Groggy', 'Disrupted']);
  });

  it('does not fall back to the creatine sleep routine', async () => {
    const routine = await extract('Before-bedtime passive body heating by warm shower or bath to improve sleep');
    expect(routine.id).toBe('warm-bath-sleep');
  });
});

describe('QA TC-04 · Forward head posture (Harman 2005)', () => {
  it('schedules milestone photos on days 1, 14 and 30', async () => {
    const routine = await extract('10.1179/106698105790824888');
    const photo = field(routine, 'cp-posture-photo');
    expect(photo?.type).toBe('photo');
    expect(photo?.frequency).toBe('milestone');
    expect(photo?.milestoneDays).toEqual([1, 14, 30]);
  });

  it('uses a 5-second isometric hold for the chin tuck', async () => {
    const routine = await extract('10.1179/106698105790824888');
    const chinTuck = routine.steps.find((s) => s.id === 'cp-1');
    expect(chinTuck?.tempo).toBe('5s isometric hold');
    expect(chinTuck?.durationSeconds).toBe(5);
  });

  it('tracks cervical tension / headache, not joint soreness', async () => {
    const routine = await extract('10.1179/106698105790824888');
    expect(routine.feedbackMetric?.label).toBe('cervical tension / headache');
  });
});

describe('QA TC-05 · KSM-66 Ashwagandha (Chandrasekhar 2012)', () => {
  it('labels the dose in capsules, Morning & Night with food, 300 mg', async () => {
    const routine = await extract(
      'A prospective, randomized double-blind, placebo-controlled study of safety and efficacy of a high-concentration full-spectrum extract of Ashwagandha root in reducing stress and anxiety in adults'
    );
    const step = routine.steps[0];
    expect(step.setLabel).toBe('capsules');
    expect(step.frequency).toBe('Morning & Night with food');
    expect(step.statValue).toBe('300 mg');
    expect(step.sets).toBe(2);
  });

  it('flags the omitted water volume with a 250 mL guideline', async () => {
    const routine = await extract('10.4103/0253-7176.106022');
    expect(routine.steps[0].inferredProvenance?.tier).toBe('guideline');
    expect(routine.missingDataFlags[0].fallback).toContain('250 mL');
  });

  it('advises splitting the dose with meals when GI distress ≥ 4', async () => {
    const routine = await extract('10.4103/0253-7176.106022');
    expect(routine.feedbackMetric?.name).toBe('GI distress');
    expect(routine.feedbackMetric?.escalationThreshold).toBe(4);
    expect(routine.feedbackMetric?.escalationMessage).toContain('Split-dose rule');
    expect(routine.progressionRules.some((r) => r.action.startsWith('Split-dose rule'))).toBe(true);
  });
});

describe('QA TC-06 · Dual n-back (Jaeggi 2008)', () => {
  it('runs a 20-minute daily session with a countdown timer', async () => {
    const routine = await extract('Improving fluid intelligence with training on working memory');
    expect(routine.steps[0].durationSeconds).toBe(1200);
    expect(field(routine, 'nb-session-timer')).toMatchObject({ timerMode: 'countdown', max: 1200 });
  });

  it('includes the adaptive N-level progression rule', async () => {
    const routine = await extract('10.1073/pnas.0801268105');
    const rule = routine.progressionRules.find((r) => r.id === 'nb-rule-1');
    expect(COPY.dashboard.progressionHoldingRule(rule!.condition, rule!.action)).toBe(
      'Holding until the rule is met: if block accuracy > 80% for 3 days, advance n-level by 1.'
    );
  });

  it('tracks mental fatigue / cognitive strain on a 0–10 scale', async () => {
    const routine = await extract('10.1073/pnas.0801268105');
    expect(routine.feedbackMetric?.label).toBe('mental fatigue / cognitive strain');
    expect(field(routine, 'nb-fatigue')).toMatchObject({ type: 'scale', min: 0, max: 10 });
  });
});
