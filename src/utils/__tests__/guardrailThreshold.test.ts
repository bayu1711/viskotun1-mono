import { describe, expect, it } from 'vitest';
import { achillesRoutine } from '../../data/routines/achilles';
import { applyGuardrailThreshold } from '../routineMetrics';

describe('applyGuardrailThreshold', () => {
  it('applies the policy threshold and message to the feedback metric and scale fields', () => {
    const updated = applyGuardrailThreshold(achillesRoutine, 5, 'Policy message');

    expect(updated.feedbackMetric?.escalationThreshold).toBe(5);
    expect(updated.feedbackMetric?.escalationMessage).toBe('Policy message');
    const scaleFields = (updated.dataCollectionSpec || []).filter((f) => f.type === 'scale');
    expect(scaleFields.length).toBeGreaterThan(0);
    scaleFields.forEach((f) => expect(f.escalationThreshold).toBe(5));
  });

  it('returns the same object when the policy is already applied', () => {
    const once = applyGuardrailThreshold(achillesRoutine, 5, 'Policy message');
    const twice = applyGuardrailThreshold(once, 5, 'Policy message');

    expect(twice).toBe(once);
  });

  it('keeps existing messages when the policy has none', () => {
    const updated = applyGuardrailThreshold(achillesRoutine, 6);

    expect(updated.feedbackMetric?.escalationMessage).toBe(achillesRoutine.feedbackMetric?.escalationMessage);
    expect(applyGuardrailThreshold(updated, 6)).toBe(updated);
  });
});
