/**
 * Server-side identity for route handlers.
 *
 * The browser signs in with the Firebase client SDK and sends its ID token as
 * `Authorization: Bearer <token>`. This module verifies that token against Google's
 * public keys, so a route never trusts a `userId` sent in a body or query string.
 *
 * Admin rights come only from the server: a Firebase custom claim `admin: true`,
 * a uid listed in ADMIN_UIDS, or a verified email listed in ADMIN_EMAILS.
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { NextResponse } from 'next/server';

const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  isAnonymous: boolean;
  isAdmin: boolean;
}

type TokenVerifier = (token: string) => Promise<AuthenticatedUser | null>;

let remoteKeySet: ReturnType<typeof createRemoteJWKSet> | null = null;
let verifierOverride: TokenVerifier | null = null;

/** Lets unit tests replace token verification without network access. */
export function setTokenVerifierForTests(verifier: TokenVerifier | null): void {
  verifierOverride = verifier;
}

export function getFirebaseProjectId(): string {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    'gen-lang-client-0064688276'
  ).trim();
}

function parseList(value: string | undefined): Set<string> {
  return new Set(
    (value || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminIdentity(identity: {
  uid: string;
  email?: string;
  emailVerified: boolean;
  adminClaim?: unknown;
}): boolean {
  if (identity.adminClaim === true) return true;
  if (parseList(process.env.ADMIN_UIDS).has(identity.uid.toLowerCase())) return true;
  const email = identity.email?.toLowerCase();
  return Boolean(email && identity.emailVerified && parseList(process.env.ADMIN_EMAILS).has(email));
}

function toAuthenticatedUser(payload: JWTPayload): AuthenticatedUser | null {
  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  if (!uid) return null;

  const email = typeof payload.email === 'string' ? payload.email : undefined;
  const emailVerified = payload.email_verified === true;
  const firebaseClaim = payload.firebase as { sign_in_provider?: string } | undefined;

  return {
    uid,
    email,
    emailVerified,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    isAnonymous: firebaseClaim?.sign_in_provider === 'anonymous',
    isAdmin: isAdminIdentity({ uid, email, emailVerified, adminClaim: payload.admin })
  };
}

export async function verifyIdToken(token: string): Promise<AuthenticatedUser | null> {
  if (verifierOverride) return verifierOverride(token);

  const projectId = getFirebaseProjectId();
  if (!projectId || !token) return null;

  remoteKeySet ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

  try {
    const { payload } = await jwtVerify(token, remoteKeySet, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256']
    });
    return toAuthenticatedUser(payload);
  } catch {
    return null;
  }
}

/** Returns the signed-in caller, or null when the request has no valid ID token. */
export async function getRequestUser(request: Request): Promise<AuthenticatedUser | null> {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return verifyIdToken(match[1].trim());
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Sign in to continue.', code: 'unauthorized' }, { status: 401 });
}

export function forbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'You do not have access to this action.', code: 'forbidden' }, { status: 403 });
}

/** Resolves the caller or a ready 401 response. Usage: `if (auth instanceof Response) return auth;` */
export async function requireUser(request: Request): Promise<AuthenticatedUser | NextResponse> {
  const user = await getRequestUser(request);
  return user ?? unauthorizedResponse();
}

/** Resolves an admin caller, or a 401/403 response. */
export async function requireAdmin(request: Request): Promise<AuthenticatedUser | NextResponse> {
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  if (!user.isAdmin) return forbiddenResponse();
  return user;
}
