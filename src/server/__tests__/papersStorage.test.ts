import { describe, expect, it } from 'vitest';
import { getSamplePapers, savePaper, getUserPapers } from '../papersStorage';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/papers/route';

describe('papersStorage and /api/papers endpoint', () => {
  it('retrieves sample papers with pre-calibrated protocols', async () => {
    const { samplePapers, protocols, source } = await getSamplePapers();
    expect(samplePapers.length).toBeGreaterThanOrEqual(6);
    expect(protocols['achilles']).toBeDefined();
    expect(protocols['hair-loss']).toBeDefined();
    expect(protocols['creatine-sleep']).toBeDefined();
    expect(['firestore-live', 'memory-cache']).toContain(source);
  });

  it('persists a new paper to the papers collection and retrieves it', async () => {
    const testPaper = {
      id: 'test-paper-upload-1',
      title: 'Eccentric Calf Loading for Achilles Tendinopathy',
      shortTitle: 'calf loading',
      domain: 'Musculoskeletal Rehabilitation',
      category: 'rehab',
      authors: 'Alfredson H., et al.',
      journal: 'AJSM',
      year: 2024,
      doi: '10.1177/03635465980260030301',
      openAccessUrl: 'https://doi.org/10.1177/03635465980260030301',
      pdfUrl: 'https://example.com/paper.pdf',
      summary: 'Heel drops for tendinopathy',
      featuresTested: ['3x15 heel drops'],
      isSample: false,
      userId: 'test-user-123',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const saveResult = await savePaper(testPaper);
    expect(saveResult.success).toBe(true);

    const userPapers = await getUserPapers('test-user-123');
    expect(userPapers.some((p) => p.id === 'test-paper-upload-1')).toBe(true);
  });

  it('GET /api/papers returns sample papers', async () => {
    const req = new NextRequest('http://localhost:3000/api/papers?type=samples');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.samplePapers).toBeDefined();
    expect(Array.isArray(data.samplePapers)).toBe(true);
    expect(data.protocols).toBeDefined();
  });

  it('POST /api/papers validates paper presence', async () => {
    const req = new NextRequest('http://localhost:3000/api/papers', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
