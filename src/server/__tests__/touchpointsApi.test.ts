import { afterEach, describe, expect, it } from 'vitest';
import { GET as getCalendarFeed } from '../../app/api/calendar/[token]/route';
import { POST as postCron } from '../../app/api/notifications/cron/route';
import {
  DELETE as deletePrefs,
  GET as getPrefs,
  POST as postPrefs
} from '../../app/api/notifications/preferences/route';
import { POST as postTelegramWebhook } from '../../app/api/telegram/webhook/route';
import { achillesRoutine } from '../../data/routines/achilles';
import { buildDailyNudgePayload } from '../../utils/notifications';
import { findDueAvailabilityWindow } from '../touchpoints';
import {
  deleteUserAccount,
  getUserRecord,
  saveUserRecord
} from '../userStorage';

const TEST_USER_ID = 'usr-touchpoints-api-test';

describe('Automated Touchpoints: Live Calendar Feed, Web Push FCM & Telegram', () => {
  afterEach(async () => {
    delete process.env.CRON_SECRET;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    await deleteUserAccount(TEST_USER_ID);
  });

  it('serves a live text/calendar feed and rotates tokens cleanly', async () => {
    await saveUserRecord({
      userId: TEST_USER_ID,
      activeRoutineId: achillesRoutine.id,
      routines: [achillesRoutine],
      runtime: {},
      profile: {
        availabilityMode: 'windows',
        availableWindows: [{ id: 'evening', label: 'Evening', start: '20:30', end: '21:15' }]
      },
      updatedAt: Date.now()
    });

    const prefsRes = await getPrefs(
      new Request(`https://trialn1.app/api/notifications/preferences?userId=${TEST_USER_ID}`)
    );
    expect(prefsRes.status).toBe(200);
    const prefsData = await prefsRes.json();
    expect(prefsData.calendarFeedToken).toBeTruthy();
    expect(prefsData.calendarFeedWebcalUrl).toContain('webcal://');

    const icsRes = await getCalendarFeed(new Request(prefsData.calendarFeedHttpsUrl), {
      params: { token: prefsData.calendarFeedToken }
    });
    expect(icsRes.status).toBe(200);
    expect(icsRes.headers.get('Content-Type')).toContain('text/calendar');
    const icsText = await icsRes.text();
    expect(icsText).toContain('BEGIN:VCALENDAR');
    expect(icsText).toContain('achilles rehab');

    // Rotate token -> previous token should return 404
    const rotateRes = await postPrefs(
      new Request('https://trialn1.app/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: TEST_USER_ID, action: 'rotate_calendar_token' })
      })
    );
    const rotated = await rotateRes.json();
    expect(rotated.calendarFeedToken).not.toBe(prefsData.calendarFeedToken);

    const oldRes = await getCalendarFeed(new Request(prefsData.calendarFeedHttpsUrl), {
      params: { token: prefsData.calendarFeedToken }
    });
    expect(oldRes.status).toBe(404);
  });

  it('registers and removes Web Push (FCM) device tokens safely', async () => {
    const regRes = await postPrefs(
      new Request('https://trialn1.app/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          action: 'register_fcm_token',
          fcmToken: 'fcm-device-token-abc123'
        })
      })
    );
    expect(regRes.status).toBe(200);
    const regData = await regRes.json();
    expect(regData.webPushTokenCount).toBe(1);

    const delRes = await deletePrefs(
      new Request('https://trialn1.app/api/notifications/preferences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          target: 'web_push',
          fcmToken: 'fcm-device-token-abc123'
        })
      })
    );
    const delData = await delRes.json();
    expect(delData.webPushTokenCount).toBe(0);
  });

  it('links Telegram via /start code and applies 1-tap Micro / Complete actions cleanly', async () => {
    await saveUserRecord({
      userId: TEST_USER_ID,
      activeRoutineId: achillesRoutine.id,
      routines: [achillesRoutine],
      runtime: {},
      updatedAt: Date.now()
    });

    const linkRes = await postPrefs(
      new Request('https://trialn1.app/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: TEST_USER_ID, action: 'generate_telegram_link' })
      })
    );
    const linkData = await linkRes.json();
    const linkCode = linkData.telegram.linkCode;
    expect(linkCode).toMatch(/^[A-F0-9]{8}$/);

    // Webhook `/start <linkCode>`
    const startRes = await postTelegramWebhook(
      new Request('https://trialn1.app/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            text: `/start ${linkCode}`,
            chat: { id: 987654321, username: 'trial_tester' },
            from: { username: 'trial_tester' }
          }
        })
      })
    );
    expect(startRes.status).toBe(200);
    const startBody = await startRes.json();
    expect(startBody.linkedUserId).toBe(TEST_USER_ID);

    // 1-tap "Tough Day -> Micro" callback
    const microRes = await postTelegramWebhook(
      new Request('https://trialn1.app/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query: {
            id: 'cb-micro-1',
            data: 'nudge:switch_micro',
            message: { chat: { id: 987654321 } }
          }
        })
      })
    );
    expect(microRes.status).toBe(200);
    const afterMicro = await getUserRecord(TEST_USER_ID);
    expect(afterMicro?.runtime[achillesRoutine.id]?.doseMode).toBe('micro');

    // 1-tap "Done Full Set" callback
    const completeRes = await postTelegramWebhook(
      new Request('https://trialn1.app/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query: {
            id: 'cb-done-2',
            data: 'nudge:complete_day',
            message: { chat: { id: 987654321 } }
          }
        })
      })
    );
    expect(completeRes.status).toBe(200);
    const afterDone = await getUserRecord(TEST_USER_ID);
    const firstStep = achillesRoutine.steps[0];
    expect(afterDone?.runtime[achillesRoutine.id]?.setsDone[firstStep.id]).toBe(firstStep.sets);
  });

  it('matches due availability windows, builds shared nudge payloads, and enforces CRON_SECRET', async () => {
    const dueRecord = {
      userId: TEST_USER_ID,
      activeRoutineId: achillesRoutine.id,
      routines: [achillesRoutine],
      runtime: {},
      profile: {
        displayName: 'Nadia',
        availabilityMode: 'windows' as const,
        availableWindows: [{ id: 'ev', label: 'Evening', start: '20:30', end: '21:30' }]
      },
      lifestyleProfile: {
        region: {
          countryCode: 'AE',
          countryName: 'United Arab Emirates',
          city: 'Abu Dhabi',
          detectedBy: 'user_selected' as const,
          confirmed: true
        },
        isRamadanFastingObserver: true,
        activeTags: ['ramadan_fasting'],
        intakeCompleted: true
      },
      updatedAt: Date.now()
    };

    const at2035 = new Date(Date.UTC(2026, 10, 25, 20, 35, 0));
    expect(findDueAvailabilityWindow(dueRecord, at2035)).toBe('Evening (20:30)');

    const at1400 = new Date(Date.UTC(2026, 10, 25, 14, 0, 0));
    expect(findDueAvailabilityWindow(dueRecord, at1400)).toBeNull();

    const payload = buildDailyNudgePayload({
      routine: achillesRoutine,
      userProfile: dueRecord.profile,
      lifestyleProfile: dueRecord.lifestyleProfile,
      day: 3,
      windowLabel: 'Evening (20:30)'
    });
    expect(payload.title).toContain('Day 3');
    expect(payload.body).toContain('Nadia');
    expect(payload.body).toContain('Abu Dhabi');

    process.env.CRON_SECRET = 'super-secret-cron';
    const unauthorizedCron = await postCron(
      new Request('https://trialn1.app/api/notifications/cron', { method: 'POST' })
    );
    expect(unauthorizedCron.status).toBe(401);

    const authorizedCron = await postCron(
      new Request('https://trialn1.app/api/notifications/cron', {
        method: 'POST',
        headers: { Authorization: 'Bearer super-secret-cron' }
      })
    );
    expect(authorizedCron.status).toBe(200);
  });
});
