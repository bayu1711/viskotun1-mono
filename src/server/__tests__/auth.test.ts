import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getRequestUser,
  isAdminIdentity,
  requireAdmin,
  requireUser,
  setTokenVerifierForTests
} from '../auth';
import { installTestAuth } from './authTestUtils';

describe('auth', () => {
  beforeEach(() => {
    installTestAuth();
  });

  afterEach(() => {
    setTokenVerifierForTests(null);
  });

  it('extracts and verifies Bearer token user', async () => {
    const req = new Request('https://example.com/api/test', {
      headers: { Authorization: 'Bearer test:alice-123' }
    });
    const user = await getRequestUser(req);
    expect(user).not.toBeNull();
    expect(user?.uid).toBe('alice-123');
    expect(user?.isAdmin).toBe(false);
  });

  it('identifies admin token user', async () => {
    const req = new Request('https://example.com/api/test', {
      headers: { Authorization: 'Bearer test-admin:admin-bob' }
    });
    const user = await getRequestUser(req);
    expect(user).not.toBeNull();
    expect(user?.uid).toBe('admin-bob');
    expect(user?.isAdmin).toBe(true);
  });

  it('requireUser returns 401 when unauthenticated', async () => {
    const req = new Request('https://example.com/api/test');
    const res = await requireUser(req);
    expect(res).toBeInstanceOf(Response);
    if (res instanceof Response) {
      expect(res.status).toBe(401);
    }
  });

  it('requireAdmin returns 403 for non-admin user', async () => {
    const req = new Request('https://example.com/api/test', {
      headers: { Authorization: 'Bearer test:user-123' }
    });
    const res = await requireAdmin(req);
    expect(res).toBeInstanceOf(Response);
    if (res instanceof Response) {
      expect(res.status).toBe(403);
    }
  });

  it('isAdminIdentity respects ADMIN_UIDS and ADMIN_EMAILS', () => {
    process.env.ADMIN_UIDS = 'uid-root,uid-lead';
    process.env.ADMIN_EMAILS = 'lead@trialn1.org';

    expect(isAdminIdentity({ uid: 'uid-root', emailVerified: false })).toBe(true);
    expect(isAdminIdentity({ uid: 'other', email: 'lead@trialn1.org', emailVerified: true })).toBe(true);
    expect(isAdminIdentity({ uid: 'other', email: 'lead@trialn1.org', emailVerified: false })).toBe(false);
    expect(isAdminIdentity({ uid: 'other', email: 'random@test.com', emailVerified: true })).toBe(false);

    delete process.env.ADMIN_UIDS;
    delete process.env.ADMIN_EMAILS;
  });
});
