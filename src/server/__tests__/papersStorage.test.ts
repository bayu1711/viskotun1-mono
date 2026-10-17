import { describe, expect, it } from 'vitest';
import { getSamplePapers, savePaper, getUserPapers } from '../papersStorage';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/papers/route';

describe('papersStorage and /api/papers endpoint', () => {
  it('retrieves sample and trending papers with pre-calibrated protocols sorted by popularity', async () => {
    const { samplePapers, trendingPapers, protocols, source } = await getSamplePapers();
    expect(samplePapers.length).toBeGreaterThanOrEqual(6);
    expect(trendingPapers.length).toBeGreaterThanOrEqual(6);
    expect(protocols['achilles']).toBeDefined();
    expect(protocols['hair-loss']).toBeDefined();
    expect(protocols['creatine-sleep']).toBeDefined();
    expect(['firestore-live', 'memory-cache']).toContain(source);

    // Verify trending papers are sorted descending by popularityScore
    expect(trendingPapers[0].id).toBe('achilles-rehab');
    expect(trendingPapers[0].trendingRank).toBe(1);
    expect(trendingPapers[0].popularityScore).toBe(98);
    expect(trendingPapers[0].activeTrackersCount).toBe(4);
    expect(trendingPapers[0].totalLogsCount).toBe(30);

    // Verify other papers have authentic telemetry
    const hairPaper = trendingPapers.find((p) => p.id === 'hair-regrowth');
    expect(hairPaper?.activeTrackersCount).toBe(4);
    expect(hairPaper?.totalLogsCount).toBe(21);

    const creatinePaper = trendingPapers.find((p) => p.id === 'creatine-sleep');
    expect(creatinePaper?.activeTrackersCount).toBe(2);
    expect(creatinePaper?.totalLogsCount).toBe(12);

    const fastingPaper = trendingPapers.find((p) => p.id === 'time-restricted-eating');
    expect(fastingPaper?.activeTrackersCount).toBe(0);
    expect(fastingPaper?.totalLogsCount).toBe(0);

    // Verify protocols start on Day 1 with empty history and no initial logs
    expect(protocols['achilles'].currentDay).toBe(1);
    expect(protocols['achilles'].dayHistory).toEqual([]);
    expect(protocols['achilles'].initialSetsDone).toEqual({});
    expect(protocols['hair-loss'].currentDay).toBe(1);
    expect(protocols['hair-loss'].dayHistory).toEqual([]);
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

  it('GET /api/papers returns sample and trending papers', async () => {
    const req = new NextRequest('http://localhost:3000/api/papers?type=trending');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.samplePapers).toBeDefined();
    expect(data.trendingPapers).toBeDefined();
    expect(Array.isArray(data.trendingPapers)).toBe(true);
    expect(data.trendingPapers[0].trendingRank).toBe(1);
    expect(data.protocols).toBeDefined();
    expect(data.protocols['achilles'].currentDay).toBe(1);
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

  it('assigns trending and sample papers to user fazarathfazal@gmail.com in the database', async () => {
    const userPapers = await getUserPapers('fazarathfazal@gmail.com');
    expect(userPapers.length).toBeGreaterThanOrEqual(5);
    expect(userPapers.some((p) => p.id === 'achilles-rehab')).toBe(true);
    expect(userPapers.every((p) => p.userId === 'fazarathfazal@gmail.com')).toBe(true);
  });
});
