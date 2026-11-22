import { describe, expect, it } from 'vitest';
import { validateExtractedRoutine } from '../routineSchema';

describe('validateExtractedRoutine', () => {
  it('validates and normalizes a valid routine', () => {
    const raw = {
      title: 'Eccentric Heel Drop Protocol',
      steps: [
        { action: 'Eccentric gastrocnemius drop', sets: 3, reps: 15 },
        { action: 'Eccentric soleus drop', sets: 3, reps: 15 }
      ]
    };
    const result = validateExtractedRoutine(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routine.steps.length).toBe(2);
      expect(result.routine.steps[0].id).toBeDefined();
      expect(result.routine.community.userCount).toBe(0);
      expect(result.routine.currentDay).toBe(1);
    }
  });

  it('rejects a routine without steps', () => {
    const raw = {
      title: 'Empty Routine',
      steps: []
    };
    const result = validateExtractedRoutine(raw);
    expect(result.ok).toBe(false);
  });

  it('deduplicates duplicate step IDs', () => {
    const raw = {
      title: 'Duplicate Step ID Routine',
      steps: [
        { id: 'step-1', action: 'Action A' },
        { id: 'step-1', action: 'Action B' }
      ]
    };
    const result = validateExtractedRoutine(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.routine.steps[0].id).not.toBe(result.routine.steps[1].id);
    }
  });
});
