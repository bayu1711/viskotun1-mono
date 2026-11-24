import { NextResponse } from 'next/server';
import { findUserByCalendarToken } from '../../../../server/userStorage';
import { resolveActiveRoutineForRecord } from '../../../../server/touchpoints';
import { generateIcsCalendar } from '../../../../utils/calendar';
import { buildCalendarBlocksForRoutine } from '../../../../utils/schedule';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: { token: string } }
) {
  const token = context.params?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: 'Calendar feed token required' }, { status: 400 });
  }

  const record = await findUserByCalendarToken(token);
  if (!record || record.accountStatus === 'deactivated') {
    return NextResponse.json({ error: 'Calendar feed not found' }, { status: 404 });
  }

  const routine = resolveActiveRoutineForRecord(record);
  const { blocks } = buildCalendarBlocksForRoutine(routine, record.profile);
  const icsBody = generateIcsCalendar(routine, { blocks });

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="trialn1-${routine.id}.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
