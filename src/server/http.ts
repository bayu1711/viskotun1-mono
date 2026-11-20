import { NextResponse } from 'next/server';
import { logError } from './log';
import { isPersistenceError } from './persistence';

/** Maps a caught route error to a response: 503 when storage is down, 500 otherwise. */
export function errorResponse(context: string, error: unknown, fallbackMessage: string): NextResponse {
  logError(context, error);
  if (isPersistenceError(error)) {
    return NextResponse.json(
      { error: 'Storage is temporarily unavailable. Your change was not saved; please try again.', code: 'storage_unavailable' },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

/** Reads a JSON body, returning null for a missing or malformed body instead of throwing. */
export async function readJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as T) : null;
  } catch {
    return null;
  }
}

/** Trims and caps a free-text field. Returns '' for non-strings. */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}
