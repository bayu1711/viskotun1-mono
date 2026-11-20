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
    message.includes('too many requests') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
}

function runWithTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function isTimeoutError(err: unknown): boolean {
  const message = String((err as { message?: unknown })?.message ?? err).toLowerCase();
  return message.includes('timed out') || message.includes('timeout');
}

export interface FailoverOptions {
  /** Hard cap on the whole call across all keys. Defaults to 1.5x the per-key timeout. */
  totalDeadlineMs?: number;
}

/** Below this much remaining time another attempt cannot finish, so we stop. */
const MIN_ATTEMPT_MS = 5_000;

/**
 * Executes a Gemini operation with automatic rotation and failover across the key pool.
 * A 429/quota error moves straight to the next key. A timeout fails over at most once,
 * because a slow request is usually slow on every key, and the whole call is bounded by
 * `totalDeadlineMs` so N keys can never mean N full timeouts.
 */
export async function executeWithGeminiFailover<T>(
  action: (apiKey: string, keyIndex: number, totalKeys: number) => Promise<T>,
  perKeyTimeoutMs = 15000,
  options: FailoverOptions = {}
): Promise<T> {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) {
    throw new Error('No GEMINI_API_KEYS or GEMINI_API_KEY configured');
  }

  const deadline = Date.now() + (options.totalDeadlineMs ?? Math.round(perKeyTimeoutMs * 1.5));
  const startIndex = currentKeyIndex % keys.length;
  // Advance index for subsequent calls to distribute traffic
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  let lastError: unknown;
  let timeoutFailovers = 0;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const remaining = deadline - Date.now();
    if (attempt > 0 && remaining < MIN_ATTEMPT_MS) break;

    const targetIdx = (startIndex + attempt) % keys.length;
    const apiKey = keys[targetIdx];

    try {
      return await runWithTimeout(
        action(apiKey, targetIdx, keys.length),
        Math.max(1, Math.min(perKeyTimeoutMs, remaining)),
        `Gemini API operation [key #${targetIdx + 1}]`
      );
    } catch (err: unknown) {
      lastError = err;

      if (!isRateLimitOrQuotaError(err)) {
        // A validation or syntax error will fail on every key, so do not fail over
        throw err;
      }

      if (isTimeoutError(err)) {
        timeoutFailovers += 1;
        if (timeoutFailovers > 1) break;
      }

      console.warn(
        `[GeminiKeyManager] Key #${targetIdx + 1} hit quota/rate limit or timeout. Attempting failover to next key...`
      );
    }
  }

  console.error('[GeminiKeyManager] Gemini call failed after failover or deadline.');
  throw lastError;
}
