import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/tts/route';

describe('/api/tts route handler', () => {
  it('returns 400 if text is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({})
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('text');
  });

  it('returns 400 if text exceeds max length', async () => {
    const longText = 'a'.repeat(1201);
    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text: longText })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('maximum allowed limit');
  });

  it('calculates duration estimate and respects speed clamp', async () => {
    const text = 'Perform 3 sets of 15 repetitions with 3 seconds eccentric lowering.';
    const req = new NextRequest('http://localhost:3000/api/tts', {
      method: 'POST',
      body: JSON.stringify({ text, speed: 1.15 })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.text).toBe(text);
    expect(data.wordCount).toBe(11);
    expect(data.speed).toBe(1.15);
    expect(data.estimatedDurationSec).toBeGreaterThan(0);
    expect(res.headers.get('Cache-Control')).toContain('max-age=3600');
  });
});
