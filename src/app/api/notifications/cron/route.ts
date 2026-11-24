import { NextResponse } from 'next/server';
import { dispatchDueTouchpoints } from '../../../../server/touchpoints';

export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get('authorization') || '';
  return auth === `Bearer ${secret}`;
}

async function handleCron(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await dispatchDueTouchpoints({ now: new Date() });
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error('[TouchpointsCron] Dispatch failed:', err);
    return NextResponse.json({ error: 'Touchpoint cron dispatch failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
