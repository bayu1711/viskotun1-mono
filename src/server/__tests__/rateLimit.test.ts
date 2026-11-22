import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkRateLimit,
  enforceRateLimit,
  resetRateLimitsForTests,
  RATE_LIMITS
} from '../rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it('allows requests within limit', () => {
    const req = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': '192.0.2.1' }
    });
    const rule = { limit: 2, windowMs: 10_000 };

    expect(checkRateLimit('test', req, 'user-1', rule)).toEqual({ ok: true });
    expect(checkRateLimit('test', req, 'user-1', rule)).toEqual({ ok: true });
  });

  it('blocks requests exceeding limit', () => {
    const req = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': '192.0.2.2' }
    });
    const rule = { limit: 2, windowMs: 10_000 };

    checkRateLimit('test', req, 'user-2', rule);
    checkRateLimit('test', req, 'user-2', rule);
    const result = checkRateLimit('test', req, 'user-2', rule);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSec).toBeGreaterThan(0);
    }
  });

  it('enforces anonymous share correctly', () => {
    const req = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': '192.0.2.3' }
    });
    const rule = { limit: 4, windowMs: 10_000 };

    // Anonymous limit is floor(4 * 0.5) = 2
    expect(checkRateLimit('test', req, null, rule)).toEqual({ ok: true });
    expect(checkRateLimit('test', req, null, rule)).toEqual({ ok: true });
    const blocked = checkRateLimit('test', req, null, rule);
    expect(blocked.ok).toBe(false);
  });

  it('enforceRateLimit returns 429 response when exceeded', () => {
    const req = new Request('https://example.com/api/extract', {
      headers: { 'x-forwarded-for': '192.0.2.4' }
    });

    // Extract limit is 10 for users, 5 for anonymous
    for (let i = 0; i < 5; i++) {
      expect(enforceRateLimit('extract', req, null)).toBeNull();
    }
    const response = enforceRateLimit('extract', req, null);
    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
  });
});
