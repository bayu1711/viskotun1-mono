import { setTokenVerifierForTests } from '../auth';

/**
 * Test-only token verifier: `Bearer test:<uid>` is a signed-in user and
 * `Bearer test-admin:<uid>` an admin. Real tokens are never verified in unit tests.
 */
export function installTestAuth(): void {
  setTokenVerifierForTests(async (token) => {
    const match = token.match(/^test(-admin)?:(.+)$/);
    if (!match) return null;
    return {
      uid: match[2],
      email: `${match[2]}@example.test`,
      emailVerified: true,
      isAnonymous: false,
      isAdmin: Boolean(match[1])
    };
  });
}

export function authHeaders(uid: string, options: { admin?: boolean } = {}): Record<string, string> {
  return { Authorization: `Bearer test${options.admin ? '-admin' : ''}:${uid}` };
}
