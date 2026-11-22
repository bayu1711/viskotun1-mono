import { beforeEach, describe, expect, it } from 'vitest';
import {
  getExtractionCandidate,
  resetCandidateStoreForTests,
  saveExtractionCandidate
} from '../candidateStore';
import type { Routine } from '../../types/routine';

describe('candidateStore', () => {
  beforeEach(() => {
    resetCandidateStoreForTests();
  });

  const sampleRoutine = {
    id: 'test-routine',
    title: 'Test Routine',
    steps: []
  } as unknown as Routine;

  it('saves and retrieves an extraction candidate', async () => {
    const id = await saveExtractionCandidate(sampleRoutine, 'europe-pmc', 'user-123');
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);

    const retrieved = await getExtractionCandidate(id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(id);
    expect(retrieved?.sourceKind).toBe('europe-pmc');
    expect(retrieved?.createdBy).toBe('user-123');
    expect(retrieved?.routine.id).toBe('test-routine');
  });

  it('returns null for invalid or non-existent IDs', async () => {
    expect(await getExtractionCandidate('not-a-uuid')).toBeNull();
    expect(await getExtractionCandidate('12345678-1234-1234-1234-1234567890ab')).toBeNull();
  });
});
