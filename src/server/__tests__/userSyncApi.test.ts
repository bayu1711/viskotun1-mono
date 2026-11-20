import { beforeAll, describe, expect, it } from 'vitest';
import { GET, POST } from '../../app/api/user/sync/route';
import { getUserRecord, memoryUserStorage } from '../userStorage';
import type { Routine } from '../../types/routine';
import { achillesRoutine } from '../../data/routines/achilles';
import { authHeaders, installTestAuth } from './authTestUtils';

const runtimeFor = (sets: number) => ({
  achilles: {
    setsDone: { 'ach-1': sets },
    excludedStepIds: [],
    feedbackLogs: [],
    morphingLogs: [],
    messages: [],
    escalationPaused: false,
    assistantTyping: false
  }
});

function postSync(uid: string | null, body: unknown) {
  return POST(
    new Request('http://localhost:3000/api/user/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(uid ? authHeaders(uid) : {}) },
      body: JSON.stringify(body)
    })
  );
}

function getSync(uid: string | null, query = '') {
  return GET(
    new Request(`http://localhost:3000/api/user/sync${query}`, {
      headers: uid ? authHeaders(uid) : {}
    })
  );
}

describe('User Sync API Route', () => {
  const testUserId = `test-sync-user-${Date.now()}`;
  const sampleRoutine: Routine = achillesRoutine;

  beforeAll(() => {
    installTestAuth();
  });

  it('rejects requests without a valid ID token', async () => {
    expect((await getSync(null, `?userId=${testUserId}`)).status).toBe(401);
    expect((await postSync(null, { userId: testUserId, routines: [] })).status).toBe(401);
  });

  it('handles GET when user has no stored routines', async () => {
    const res = await getSync(testUserId);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.found).toBe(false);
    expect(data.routines).toEqual([]);
    expect(data.runtime).toEqual({});
  });

  it('saves for the token owner and ignores a userId in the body', async () => {
    const victimId = `${testUserId}-victim`;
    const postRes = await postSync(testUserId, {
      userId: victimId,
      activeRoutineId: 'achilles',
      routines: [sampleRoutine],
      runtime: runtimeFor(1)
    });
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);
    expect(postData.routineCount).toBe(1);

    expect(await getUserRecord(victimId)).toBeNull();

    const getData = await (await getSync(testUserId, `?userId=${victimId}`)).json();
    expect(getData.found).toBe(true);
    expect(getData.activeRoutineId).toBe('achilles');
    expect(getData.routines).toHaveLength(1);
    expect(getData.routines[0].id).toBe('achilles');
    expect(getData.runtime.achilles.setsDone['ach-1']).toBe(1);
    expect(typeof getData.updatedAt).toBe('number');
  });

  it('rejects a stale write with 409 and returns the current copy', async () => {
    const current = await (await getSync(testUserId)).json();

    // Another device saves first
    const first = await postSync(testUserId, {
      activeRoutineId: 'achilles',
      routines: [sampleRoutine],
      runtime: runtimeFor(2),
      baseUpdatedAt: current.updatedAt
    });
    expect(first.status).toBe(200);

    // This device still holds the older version
    const stale = await postSync(testUserId, {
      activeRoutineId: 'achilles',
      routines: [sampleRoutine],
      runtime: runtimeFor(3),
      baseUpdatedAt: current.updatedAt
    });
    expect(stale.status).toBe(409);
    const conflict = await stale.json();
    expect(conflict.code).toBe('conflict');
    expect(conflict.current.runtime.achilles.setsDone['ach-1']).toBe(2);

    memoryUserStorage.delete(testUserId);
  });
});
