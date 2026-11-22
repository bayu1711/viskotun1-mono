import { NextResponse } from 'next/server';
import { COPY } from '../../../../data/copy';
import {
  clearUserData,
  deactivateUserAccount,
  deleteUserAccount,
  reactivateUserAccount
} from '../../../../server/userStorage';
import { getRequestUser } from '../../../../server/auth';

type AccountAction = 'clear_data' | 'deactivate' | 'reactivate';

const VALID_ACTIONS = new Set<AccountAction>(['clear_data', 'deactivate', 'reactivate']);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authUser = await getRequestUser(request);
    const body = await request.json().catch(() => null);
    const rawUserId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const userId = authUser?.uid || rawUserId;
    const action = body?.action as AccountAction | undefined;

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }
    if (!action || !VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Valid account action is required' }, { status: 400 });
    }

    if (action === 'clear_data') {
      const record = await clearUserData(userId);
      return NextResponse.json({
        success: true,
        action,
        updatedAt: record.updatedAt
      });
    }

    if (action === 'deactivate') {
      const record = await deactivateUserAccount(userId);
      return NextResponse.json({
        success: true,
        action,
        accountStatus: record.accountStatus,
        deactivatedAt: record.deactivatedAt
      });
    }

    const reactivated = await reactivateUserAccount(userId);
    return NextResponse.json({
      success: true,
      action,
      accountStatus: reactivated?.accountStatus ?? 'active'
    });
  } catch (error) {
    console.error('[AccountAPI] POST error:', error);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => null);
    const rawUserId =
      (typeof body?.userId === 'string' && body.userId) || searchParams.get('userId') || '';
    const userId = authUser?.uid || rawUserId.trim();

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const deleted = await deleteUserAccount(userId);
    return NextResponse.json({
      success: true,
      deleted,
      deletedAt: Date.now()
    });
  } catch (error) {
    console.error('[AccountAPI] DELETE error:', error);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}
