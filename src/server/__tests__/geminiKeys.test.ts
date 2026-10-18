import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getGeminiApiKeys,
  getRotatedGeminiKey,
  isRateLimitOrQuotaError,
  executeWithGeminiFailover,
  resetKeyIndex
} from '../geminiKeys';

describe('Gemini Multi-Key Rotation & Failover', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    resetKeyIndex();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('parses comma-separated GEMINI_API_KEYS with trimming and deduplication', () => {
    process.env.GEMINI_API_KEYS = ' keyA , keyB,  keyA , keyC ';
    delete process.env.GEMINI_API_KEY;

    const keys = getGeminiApiKeys();
    expect(keys).toEqual(['keyA', 'keyB', 'keyC']);
  });

  it('falls back to single GEMINI_API_KEY when GEMINI_API_KEYS is missing', () => {
    delete process.env.GEMINI_API_KEYS;
    process.env.GEMINI_API_KEY = 'singleKey123';

    const keys = getGeminiApiKeys();
    expect(keys).toEqual(['singleKey123']);
  });

  it('rotates keys in round-robin fashion', () => {
    process.env.GEMINI_API_KEYS = 'key1,key2,key3';

    const key1 = getRotatedGeminiKey();
    const key2 = getRotatedGeminiKey();
    const key3 = getRotatedGeminiKey();
    const key4 = getRotatedGeminiKey();

    expect([key1, key2, key3, key4]).toEqual(['key1', 'key2', 'key3', 'key1']);
  });

  it('identifies 429 and quota exhaustion errors accurately', () => {
    expect(isRateLimitOrQuotaError({ status: 429 })).toBe(true);
    expect(isRateLimitOrQuotaError(new Error('RESOURCE_EXHAUSTED: quota exceeded'))).toBe(true);
    expect(isRateLimitOrQuotaError(new Error('Rate limit exceeded. Please wait.'))).toBe(true);
    expect(isRateLimitOrQuotaError(new Error('Invalid prompt argument'))).toBe(false);
  });

  it('automatically fails over to next key on 429 quota exhaustion', async () => {
    process.env.GEMINI_API_KEYS = 'failingKey,healthyKey';

    const attemptedKeys: string[] = [];

    const result = await executeWithGeminiFailover(async (apiKey) => {
      attemptedKeys.push(apiKey);
      if (apiKey === 'failingKey') {
        const error = new Error('Quota exceeded (429)');
        (error as any).status = 429;
        throw error;
      }
      return 'SUCCESS_WITH_' + apiKey;
    });

    expect(result).toBe('SUCCESS_WITH_healthyKey');
    expect(attemptedKeys).toEqual(['failingKey', 'healthyKey']);
  });

  it('throws non-quota errors immediately without needless key rotation', async () => {
    process.env.GEMINI_API_KEYS = 'key1,key2';

    const attemptedKeys: string[] = [];

    await expect(
      executeWithGeminiFailover(async (apiKey) => {
        attemptedKeys.push(apiKey);
        throw new Error('Fatal syntax error');
      })
    ).rejects.toThrow('Fatal syntax error');

    expect(attemptedKeys).toEqual(['key1']);
  });
});
