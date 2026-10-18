/**
 * Gemini API Multi-Key Manager & Auto-Failover Engine
 * 
 * Provides:
 * 1. Multi-key pool parsing (GEMINI_API_KEYS comma-delimited or GEMINI_API_KEY fallback)
 * 2. Round-robin key rotation across concurrent requests
 * 3. Automatic failover on 429 (Resource Exhausted / Rate Limit / Quota Exceeded)
 */

let currentKeyIndex = 0;

/**
 * Resets key index (used for testing and deterministic initialization)
 */
export function resetKeyIndex(): void {
  currentKeyIndex = 0;
}

/**
 * Returns all configured Gemini API keys.
 * Prioritizes GEMINI_API_KEYS (comma-separated), falling back to GEMINI_API_KEY.
 */
export function getGeminiApiKeys(): string[] {
  const multiKeys = process.env.GEMINI_API_KEYS;
  if (multiKeys && multiKeys.trim().length > 0) {
    const parsed = multiKeys
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
    if (parsed.length > 0) {
      // Deduplicate keys while preserving order
      return Array.from(new Set(parsed));
    }
  }

  const singleKey = process.env.GEMINI_API_KEY;
  if (singleKey && singleKey.trim().length > 0) {
    return [singleKey.trim()];
  }

  return [];
}

/**
 * Returns the next Gemini API key in the pool using round-robin distribution.
 */
export function getRotatedGeminiKey(): string | undefined {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return undefined;

  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Detects whether an error thrown by the Google Generative AI SDK
 * is caused by rate limiting, quota exhaustion, or 429 status.
 */
export function isRateLimitOrQuotaError(err: unknown): boolean {
  if (!err) return false;

  const errorObj = err as Record<string, unknown>;
  const status = errorObj.status || (errorObj.response as Record<string, unknown> | undefined)?.status;
  if (status === 429) return true;

  const message = String(errorObj.message || errorObj.error || err).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  );
}

/**
 * Executes a Gemini operation with automatic rotation and failover across the key pool.
 * If a key hits 429 / quota limit, it immediately attempts the next key in the pool.
 */
export async function executeWithGeminiFailover<T>(
  action: (apiKey: string, keyIndex: number, totalKeys: number) => Promise<T>
): Promise<T> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEYS or GEMINI_API_KEY configured');
  }

  const startIndex = currentKeyIndex % keys.length;
  // Advance index for subsequent calls to distribute traffic
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  let lastError: unknown;

  // Try each key in sequence starting from startIndex
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const targetIdx = (startIndex + attempt) % keys.length;
    const apiKey = keys[targetIdx];
    const maskedKey = `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;

    try {
      return await action(apiKey, targetIdx, keys.length);
    } catch (err: unknown) {
      lastError = err;

      if (isRateLimitOrQuotaError(err)) {
        console.warn(
          `[GeminiKeyManager] Key #${targetIdx + 1} (${maskedKey}) hit quota/rate limit (429). Attempting failover to next key...`
        );
        continue;
      }

      // If it's a fatal validation or syntax error, do not failover needlessly
      throw err;
    }
  }

  console.error('[GeminiKeyManager] All configured Gemini API keys exhausted their rate limits.');
  throw lastError;
}
