import { describe, expect, it } from 'vitest';
import { GET, POST } from '../../app/api/user/sync/route';
import { memoryUserStorage } from '../userStorage';
import type { Routine } from '../../types/routine';

describe('User Sync API Route', () => {
  const testUserId = `test-sync-user-${Date.now()}@domain.com`;
  const sampleRoutine: Routine = {
    id: 'achilles',
    title: 'Eccentric Achilles Protocol',
    shortTitle: 'Achilles Rehab',
    phase: 'Clinical Phase II',
    currentDay: 1,
    totalDays: 84,
    streak: 0,
    steps: [
      {
        id: 'ach-1',
        action: 'Straight-knee eccentric heel drops',
        sets: 3,
        reps: '15 reps',
        frequency: '2x daily',
        targetTime: 'morning',
        cadence: '3s down',
        inferred: false
      }
    ]
  };

  it('handles GET when user has no stored routines', async () => {
    const req = new Request(`http://localhost:3000/api/user/sync?userId=${encodeURIComponent(testUserId)}`);
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.found).toBe(false);
    expect(data.protocols).toEqual([]);
    expect(data.runtime).toEqual({});
  });

  it('handles POST to start routine and saves it in user record', async () => {
    const payload = {
      userId: testUserId,
      activeRoutineId: 'achilles',
      activeProtocolId: 'achilles',
      protocols: [sampleRoutine],
      routines: [sampleRoutine],
      runtime: {
        achilles: {
          setsDone: { 'ach-1': 1 },
          excludedStepIds: [],
          feedbackLogs: [],
          morphingLogs: [],
          messages: [],
          escalationPaused: false,
          assistantTyping: false
        }
      }
    };

    const postReq = new Request('http://localhost:3000/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const postRes = await POST(postReq);
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.routineCount).toBe(1);

    // Verify GET retrieves the saved routine across subsequent requests / reloads
    const getReq = new Request(`http://localhost:3000/api/user/sync?userId=${encodeURIComponent(testUserId)}`);
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);

    const getData = await getRes.json();
    expect(getData.found).toBe(true);
    expect(getData.activeProtocolId).toBe('achilles');
    expect(getData.protocols).toHaveLength(1);
    expect(getData.protocols[0].id).toBe('achilles');
    expect(getData.runtime.achilles.setsDone['ach-1']).toBe(1);

    // Clean up
    memoryUserStorage.delete(testUserId);
  });
});
