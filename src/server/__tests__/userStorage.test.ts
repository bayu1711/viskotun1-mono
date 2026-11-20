import { describe, expect, it } from 'vitest';
import {
  computeRoutineUserStats,
  deleteUserAccount,
  getAllUserRecords,
  getLiveUserStats,
  LEGACY_SAMPLE_USER_IDS,
  memoryUserStorage,
  saveUserRecord,
  type UserRecord
} from '../userStorage';

describe('userStorage and live community telemetry', () => {
  it('never counts example participants as real users', async () => {
    const sampleId = Array.from(LEGACY_SAMPLE_USER_IDS)[0];
    memoryUserStorage.set(sampleId, {
      userId: sampleId,
      activeRoutineId: 'achilles',
      routines: [],
      runtime: {},
      updatedAt: Date.now()
    });

    const allUsers = await getAllUserRecords();
    expect(allUsers.some((u) => LEGACY_SAMPLE_USER_IDS.has(u.userId))).toBe(false);
    memoryUserStorage.delete(sampleId);
  });

  it('aggregates trackers and logs per routine in one pass, merging routine aliases', () => {
    const users: UserRecord[] = [
      {
        userId: 'a',
        activeRoutineId: 'achilles',
        routines: [],
        runtime: {
          achilles: {
            setsDone: { s1: 3, s2: 3 },
            feedbackLogs: [{ id: 'l1', day: 1, score: 2, note: '', loggedAt: 'Day 1' }],
            messages: [],
            escalationPaused: false
          }
        },
        updatedAt: 1
      },
      {
        userId: 'b',
        activeRoutineId: 'achilles-rehab',
        routines: [],
        runtime: {},
        updatedAt: 1
      }
    ];

    const stats = computeRoutineUserStats(users);
    expect(stats.get('achilles')).toEqual({ activeTrackersCount: 2, userLogsCount: 3 });
  });

  it('increments active trackers and logs live when a real user starts tracking and logging', async () => {
    const initialStats = await getLiveUserStats('achilles');

    const testUser: UserRecord = {
      userId: 'test-real-user-live-sync',
      activeRoutineId: 'achilles',
      routines: [],
      runtime: {
        achilles: {
          setsDone: { 'ach-1': 3, 'ach-2': 3 },
          feedbackLogs: [
            { id: 'real-log-1', day: 1, score: 2, note: 'Tested live update across sessions', loggedAt: 'Day 1' }
          ],
          morphingLogs: [],
          messages: [],
          escalationPaused: false
        }
      },
      updatedAt: Date.now()
    };

    await saveUserRecord(testUser);

    const updatedStats = await getLiveUserStats('achilles');
    expect(updatedStats.activeTrackersCount).toBe(initialStats.activeTrackersCount + 1);
    // 2 sets + 1 feedback log = 3 additional logs
    expect(updatedStats.userLogsCount).toBe(initialStats.userLogsCount + 3);

    await deleteUserAccount(testUser.userId);
    const cleanedStats = await getLiveUserStats('achilles');
    expect(cleanedStats).toEqual(initialStats);
  });
});
