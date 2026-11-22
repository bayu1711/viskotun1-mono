import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/assistant/route';

describe('/api/assistant route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects requests with missing question', async () => {
    const req = new Request('http://localhost:3010/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('routes to Research Navigator when no routine is active', async () => {
    const req = new Request('http://localhost:3010/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'I have severe pain in my Achilles tendon when running'
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toBeDefined();
    expect(json.isGuidance).toBe(true);
    expect(json.suggestedQuery).toBeDefined();
    expect(json.source).toContain('Human Research');
  });

  it('routes to local rules for an active routine when cloud AI is not configured', async () => {
    const req = new Request('http://localhost:3010/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the frequency of heel drops?',
        routineTitle: 'Achilles Tendinopathy Rehab',
        shortTitle: 'Achilles Rehab',
        steps: [
          {
            id: 'step-1',
            action: 'Eccentric heel drop',
            frequency: '2x daily',
            target: '15 reps'
          }
        ]
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answer).toBeDefined();
    expect(json.source).toBeDefined();
  });
});
