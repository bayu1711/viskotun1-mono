import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Routine } from '../../types/routine';

const extractPaperRoutine = vi.fn();
vi.mock('../geminiExtraction', () => ({ extractPaperRoutine: (...args: unknown[]) => extractPaperRoutine(...args) }));

const saveCanonicalRoutine = vi.fn();
const findCanonicalRoutine = vi.fn();
vi.mock('../routineRegistry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../routineRegistry')>();
  return {
    ...actual,
    saveCanonicalRoutine: (...args: unknown[]) => saveCanonicalRoutine(...args),
    findCanonicalRoutine: (...args: unknown[]) => findCanonicalRoutine(...args)
  };
});

vi.mock('../papersStorage', () => ({
  getSamplePapers: vi.fn(),
  getUserPapers: vi.fn(),
  seedSamplePapersIfEmpty: vi.fn(),
  savePaper: vi.fn(async () => ({ source: 'memory' }))
}));

import { POST as extractPost } from '../../app/api/extract/route';
import { POST as papersPost } from '../../app/api/papers/route';

const candidate = {
  id: 'astym-achilles',
  title: 'Astym vs eccentric exercise',
  paper: { title: 'Eccentric Exercise Versus Astym', doi: '10.1177/1941738116631498' }
} as unknown as Routine;

function extractRequest() {
  const form = new FormData();
  form.append('url', 'https://doi.org/10.1177/1941738116631498');
  return new Request('http://localhost/api/extract', { method: 'POST', body: form });
}

beforeEach(() => {
  extractPaperRoutine.mockReset();
  saveCanonicalRoutine.mockReset();
  findCanonicalRoutine.mockReset();
});

describe('canonical registration', () => {
  it('does not register a fresh extraction, but gives it its canonical id', async () => {
    extractPaperRoutine.mockResolvedValue({ success: true, eligible: true, routine: candidate, protocol: candidate, source: 'x' });
    findCanonicalRoutine.mockResolvedValue(null);

    const data = await (await extractPost(extractRequest())).json();

    expect(saveCanonicalRoutine).not.toHaveBeenCalled();
    expect(data.routine.id).toBe('doi__10_1177_1941738116631498');
    expect(data.isExistingCanonical).toBe(false);
  });

  it('reuses a routine already confirmed for the same paper', async () => {
    const confirmed = { ...candidate, id: 'doi__10_1177_1941738116631498', title: 'Confirmed routine' };
    extractPaperRoutine.mockResolvedValue({ success: true, eligible: true, routine: candidate, protocol: candidate, source: 'x' });
    findCanonicalRoutine.mockResolvedValue(confirmed);

    const data = await (await extractPost(extractRequest())).json();

    expect(data.routine.title).toBe('Confirmed routine');
    expect(data.isExistingCanonical).toBe(true);
    expect(saveCanonicalRoutine).not.toHaveBeenCalled();
  });

  it('registers the routine when the user confirms it', async () => {
    saveCanonicalRoutine.mockResolvedValue({ protocol: candidate, isNew: true });
    const req = new Request('http://localhost/api/papers', {
      method: 'POST',
      body: JSON.stringify({ paper: { id: candidate.id, title: candidate.title }, routine: candidate, protocol: candidate })
    });

    const res = await papersPost(req);

    expect(res.status).toBe(200);
    expect(saveCanonicalRoutine).toHaveBeenCalledWith(candidate);
  });
});
