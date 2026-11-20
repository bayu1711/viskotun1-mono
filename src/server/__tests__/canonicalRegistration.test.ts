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
import { authHeaders, installTestAuth } from './authTestUtils';

installTestAuth();

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
    extractPaperRoutine.mockResolvedValue({ success: true, eligible: true, routine: candidate, source: 'x' });
    findCanonicalRoutine.mockResolvedValue(null);

    const data = await (await extractPost(extractRequest())).json();

    expect(saveCanonicalRoutine).not.toHaveBeenCalled();
    expect(data.routine.id).toBe('doi__10_1177_1941738116631498');
    expect(data.isExistingCanonical).toBe(false);
    // The candidate card shows "already cataloged" for canonical routines, so a fresh one must not be
    expect(data.routine.isCanonical).toBe(false);
  });

  it('reuses a routine already confirmed for the same paper', async () => {
    const confirmed = { ...candidate, id: 'doi__10_1177_1941738116631498', title: 'Confirmed routine' };
    extractPaperRoutine.mockResolvedValue({ success: true, eligible: true, routine: candidate, source: 'x' });
    findCanonicalRoutine.mockResolvedValue(confirmed);

    const data = await (await extractPost(extractRequest())).json();

    expect(data.routine.title).toBe('Confirmed routine');
    expect(data.isExistingCanonical).toBe(true);
    expect(saveCanonicalRoutine).not.toHaveBeenCalled();
  });

  it('registers the server copy of a Europe PMC extraction when the user confirms it', async () => {
    extractPaperRoutine.mockResolvedValue({
      success: true,
      eligible: true,
      routine: candidate,
      sourceKind: 'europe-pmc',
      source: 'x'
    });
    findCanonicalRoutine.mockResolvedValue(null);
    saveCanonicalRoutine.mockResolvedValue({ routine: candidate, isNew: true });

    const extracted = await (await extractPost(extractRequest())).json();
    expect(typeof extracted.candidateId).toBe('string');

    // Routine content in the body is ignored: only the stored candidate is registered
    const tampered = { ...candidate, title: 'Tampered dosing' };
    const res = await papersPost(
      new Request('http://localhost/api/papers', {
        method: 'POST',
        headers: authHeaders('confirming-user'),
        body: JSON.stringify({ candidateId: extracted.candidateId, routine: tampered })
      })
    );

    expect(res.status).toBe(200);
    expect(saveCanonicalRoutine).toHaveBeenCalledTimes(1);
    const registered = saveCanonicalRoutine.mock.calls[0][0] as Routine;
    expect(registered.title).toBe(candidate.title);
    expect(registered.id).toBe('doi__10_1177_1941738116631498');
  });

  it('keeps uploaded-PDF extractions private instead of sharing them', async () => {
    extractPaperRoutine.mockResolvedValue({
      success: true,
      eligible: true,
      routine: candidate,
      sourceKind: 'pdf-upload',
      source: 'x'
    });
    findCanonicalRoutine.mockResolvedValue(null);

    const extracted = await (await extractPost(extractRequest())).json();
    const res = await papersPost(
      new Request('http://localhost/api/papers', {
        method: 'POST',
        headers: authHeaders('confirming-user'),
        body: JSON.stringify({ candidateId: extracted.candidateId })
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).shared).toBe(false);
    expect(saveCanonicalRoutine).not.toHaveBeenCalled();
  });

  it('rejects a confirmation without sign-in or with an unknown candidate', async () => {
    const anonymous = await papersPost(
      new Request('http://localhost/api/papers', {
        method: 'POST',
        body: JSON.stringify({ candidateId: '00000000-0000-0000-0000-000000000000' })
      })
    );
    expect(anonymous.status).toBe(401);

    const unknown = await papersPost(
      new Request('http://localhost/api/papers', {
        method: 'POST',
        headers: authHeaders('confirming-user'),
        body: JSON.stringify({ candidateId: '00000000-0000-0000-0000-000000000000' })
      })
    );
    expect(unknown.status).toBe(404);
  });
});
