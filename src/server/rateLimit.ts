/**
 * Fixed-window request limiter for paid or abusable endpoints (Gemini, TTS, uploads).
 *
 * Counts live in this server instance's memory, so the effective limit scales with the
 * number of Cloud Run instances. That still stops a single client from draining the AI
 * quota; move the counters to Firestore or Cloud Armor if stricter limits are needed.
 */

import { NextResponse } from 'next/server';
import type { AuthenticatedUser } from './auth';

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitRule {
  /** Requests allowed per window */
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  extract: { limit: 10, windowMs: 60 * 60 * 1000 },
  assistant: { limit: 40, windowMs: 10 * 60 * 1000 },
  lifestyle: { limit: 40, windowMs: 10 * 60 * 1000 },
  tts: { limit: 120, windowMs: 10 * 60 * 1000 },
  upload: { limit: 30, windowMs: 60 * 60 * 1000 },
  reviews: { limit: 10, windowMs: 60 * 60 * 1000 },
  search: { limit: 60, windowMs: 10 * 60 * 1000 }
} satisfies Record<string, RateLimitRule>;

/** Signed-out callers share an IP, so they get a smaller allowance than signed-in users. */
const ANONYMOUS_SHARE = 0.5;
const MAX_TRACKED_KEYS = 20_000;

const windows = new Map<string, Window>();

export function resetRateLimitsForTests(): void {
  windows.clear();
}

export function getClientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function pruneExpired(now: number): void {
  if (windows.size < MAX_TRACKED_KEYS) return;
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key);
  }
}

export function checkRateLimit(
  bucket: string,
  request: Request,
  user: AuthenticatedUser | null,
  rule: RateLimitRule
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  pruneExpired(now);

  const identity = user ? `u:${user.uid}` : `ip:${getClientAddress(request)}`;
  const limit = user ? rule.limit : Math.max(1, Math.floor(rule.limit * ANONYMOUS_SHARE));
  const key = `${bucket}:${identity}`;

  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  return { ok: true };
}

export function rateLimitedResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please wait a moment and try again.', code: 'rate_limited' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  );
}

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function enforceRateLimit(
  bucket: keyof typeof RATE_LIMITS,
  request: Request,
  user: AuthenticatedUser | null
): NextResponse | null {
  const result = checkRateLimit(bucket, request, user, RATE_LIMITS[bucket]);
  return result.ok ? null : rateLimitedResponse(result.retryAfterSec);
}
