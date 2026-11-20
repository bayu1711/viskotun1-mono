import { NextResponse } from 'next/server';
import { COPY } from '../../../../data/copy';
import {
  clearUserData,
  deactivateUserAccount,
  deleteUserAccount,
  reactivateUserAccount
} from '../../../../server/userStorage';
import { requireUser } from '../../../../server/auth';
import { errorResponse, readJsonBody } from '../../../../server/http';

export const dynamic = 'force-dynamic';

type AccountAction = 'clear_data' | 'deactivate' | 'reactivate';

const VALID_ACTIONS = new Set<AccountAction>(['clear_data', 'deactivate', 'reactivate']);

/** POST: Account actions for the signed-in user only (taken from the verified ID token). */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await readJsonBody<{ action?: string }>(request);
    const action = body?.action as AccountAction | undefined;

    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: COPY.api.userSync.invalidAction }, { status: 400 });
    }

    if (action === 'clear_data') {
      const record = await clearUserData(auth.uid);
      return NextResponse.json({ success: true, action, updatedAt: record.updatedAt });
    }

    if (action === 'deactivate') {
      const record = await deactivateUserAccount(auth.uid);
      return NextResponse.json({
        success: true,
        action,
        accountStatus: record.accountStatus,
        deactivatedAt: record.deactivatedAt
      });
    }

    const reactivated = await reactivateUserAccount(auth.uid);
    return NextResponse.json({
      success: true,
      action,
      accountStatus: reactivated?.accountStatus ?? 'active'
    });
  } catch (error) {
    return errorResponse('AccountRoute.POST', error, COPY.api.userSync.internalError);
  }
}

/** DELETE: Permanently delete the signed-in user's stored record. */
export async function DELETE(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  try {
    const deleted = await deleteUserAccount(auth.uid);
    return NextResponse.json({ success: true, deleted, deletedAt: Date.now() });
  } catch (error) {
    return errorResponse('AccountRoute.DELETE', error, COPY.api.userSync.internalError);
  }
}
