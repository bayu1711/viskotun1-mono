/**
 * Decides whether a failed or missing Firestore/GCS write may silently fall back to
 * this instance's memory or local disk.
 *
 * In production that fallback loses data: Cloud Run instances do not share memory and
 * their disk is wiped on scale-down. So production writes fail loudly unless the
 * operator opts in with ALLOW_MEMORY_FALLBACK=true (useful for a local Docker run).
 */

export class PersistenceUnavailableError extends Error {
  constructor(store: string, cause?: unknown) {
    super(`${store} is unavailable, so the change was not saved.`);
    this.name = 'PersistenceUnavailableError';
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

export function isMemoryFallbackAllowed(): boolean {
  if (process.env.ALLOW_MEMORY_FALLBACK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

/** Throws when a write could not reach durable storage and fallback is not allowed. */
export function assertDurableWrite(store: string, cause?: unknown): void {
  if (!isMemoryFallbackAllowed()) {
    throw new PersistenceUnavailableError(store, cause);
  }
}

export function isPersistenceError(error: unknown): error is PersistenceUnavailableError {
  return error instanceof PersistenceUnavailableError;
}
