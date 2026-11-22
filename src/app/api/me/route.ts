import { NextResponse } from 'next/server';
import { requireUser } from '../../../server/auth';

export const dynamic = 'force-dynamic';

/**
 * GET: Who the server thinks the caller is. The client uses `isAdmin` from here to show
 * admin controls; the admin routes check it again on every request.
 */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  return NextResponse.json({
    uid: auth.uid,
    email: auth.email ?? null,
    emailVerified: auth.emailVerified,
    isAdmin: auth.isAdmin
  });
}
