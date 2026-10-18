import { describe, expect, it } from 'vitest';
import {
  ashwagandhaStressRoutine,
  imstBloodPressureRoutine,
  plantarFasciitisRoutine,
  warmBathSleepRoutine
} from '../../data/routines/calibrated';
import type { DataCollectionField } from '../../types/routine';
import { toPercent } from '../math';
import {
  applyGuardrailThreshold,
  completionOf,
  fieldEscalationThreshold,
  fieldValueExceedsThreshold
} from '../routineMetrics';

const specField = (fields: DataCollectionField[] | undefined, id: string) => fields!.find((f) => f.id === id)!;
const scaleField: DataCollectionField = { id: 's', name: 's', label: 's', type: 'scale', frequency: 'daily' };

describe('QA TC-01 · daily progress ring', () => {
  it('moves 0% → 33% → 67% → 100% as the 3 sets are checked', () => {
    const stepId = plantarFasciitisRoutine.steps[0].id;
    const percents = [0, 1, 2, 3].map((done) =>
      toPercent(completionOf(plantarFasciitisRoutine, { [stepId]: done }))
    );
    expect(percents).toEqual([0, 33, 67, 100]);
  });
});

describe('QA TC-05 · partial daily progress', () => {
  it('shows 50% when the morning capsule is taken and the night capsule is not', () => {
    expect(toPercent(completionOf(ashwagandhaStressRoutine, { 'ash-1': 1 }))).toBe(50);
  });
});

describe('field escalation thresholds', () => {
  it('never escalates a normal blood pressure reading (TC-02)', () => {
    const sbp = specField(imstBloodPressureRoutine.dataCollectionSpec, 'imst-sbp');
    expect(fieldEscalationThreshold(sbp)).toBeUndefined();
    expect(fieldValueExceedsThreshold(sbp, 128)).toBe(false);
  });

  it('never escalates sleep latency minutes (TC-03)', () => {
    const latency = specField(warmBathSleepRoutine.dataCollectionSpec, 'wb-sleep-latency');
    expect(fieldValueExceedsThreshold(latency, 25)).toBe(false);
  });

  it('escalates the dizziness scale at 4 / 10 (TC-02)', () => {
    const dizziness = specField(imstBloodPressureRoutine.dataCollectionSpec, 'imst-dizziness');
    expect(fieldValueExceedsThreshold(dizziness, 3)).toBe(false);
    expect(fieldValueExceedsThreshold(dizziness, 4)).toBe(true);
  });

  it('falls back to the default threshold for scale fields without one', () => {
    expect(fieldEscalationThreshold(scaleField)).toBe(4);
    expect(fieldValueExceedsThreshold(scaleField, 6)).toBe(true);
  });

  it('ignores non-numeric values', () => {
    expect(fieldValueExceedsThreshold(scaleField, 'Groggy')).toBe(false);
  });
});

describe('policy sync keeps paper-specific advice', () => {
  it('keeps protocol-owned messages but applies the policy threshold', () => {
    const updated = applyGuardrailThreshold(ashwagandhaStressRoutine, 5, 'Generic policy message');
    expect(updated.feedbackMetric?.escalationThreshold).toBe(5);
    expect(updated.feedbackMetric?.escalationMessage).toContain('Split-dose rule');
    const gi = specField(updated.dataCollectionSpec, 'ash-gi-distress');
    expect(gi.escalationThreshold).toBe(5);
    expect(gi.escalationMessage).toContain('Split-dose rule');
  });

  it('replaces policy-owned messages', () => {
    const updated = applyGuardrailThreshold(plantarFasciitisRoutine, 4, 'Updated policy message');
    expect(updated.feedbackMetric?.escalationMessage).toBe('Updated policy message');
  });

  it('is stable once applied to protocol-owned messages', () => {
    const once = applyGuardrailThreshold(ashwagandhaStressRoutine, 4, 'Generic policy message');
    expect(applyGuardrailThreshold(once, 4, 'Generic policy message')).toBe(once);
  });
});
