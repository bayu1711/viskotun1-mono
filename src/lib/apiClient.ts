/**
 * Client wrapper for calls to our own `/api/*` routes.
 *
 * Adds the signed-in Firebase user's ID token as `Authorization: Bearer <token>` so the
 * server can verify who is calling. Signed-out and guest calls go out without the header.
 * Never use this for third-party URLs.
 */

import { getFirebaseAuth } from './firebase';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { auth } = getFirebaseAuth();
  if (!auth) return {};

  try {
    await auth.authStateReady();
  } catch {
    // Treat an auth start-up failure as signed out
  }

  const currentUser = auth.currentUser;
  if (!currentUser) return {};

  try {
    const token = await currentUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  if (!input.startsWith('/api/')) {
    throw new Error('apiFetch only calls this app\'s /api routes');
  }

  const headers = new Headers(init.headers);
  if (!headers.has('Authorization')) {
    const authHeaders = await getAuthHeaders();
    for (const [key, value] of Object.entries(authHeaders)) {
      headers.set(key, value);
    }
  }

  return fetch(input, { ...init, headers });
}

/** Sends a JSON body with the auth header attached. */
export function apiPostJson(input: string, body: unknown, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  return apiFetch(input, {
    method: 'POST',
    ...init,
    headers,
    body: JSON.stringify(body)
  });
}
