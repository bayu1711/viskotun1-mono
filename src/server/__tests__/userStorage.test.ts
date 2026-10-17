import { describe, expect, it } from 'vitest';
import {
  getUserRecord,
  saveUserRecord,
  getAllUserRecords,
  getLiveUserStats,
  memoryUserStorage,
  type UserRecord
} from '../userStorage';
import { SEEDED_COMMUNITY_USERS } from '../seedUsers';

describe('userStorage and live community telemetry', () => {
  it('pre-seeds memory cache with 10 authentic simulated trial cohort participants', async () => {
    const allUsers = await getAllUserRecords();
    expect(allUsers.length).toBeGreaterThanOrEqual(10);

    for (const seeded of SEEDED_COMMUNITY_USERS) {
      const user = await getUserRecord(seeded.userId);
      expect(user).toBeDefined();
      expect(user?.userId).toBe(seeded.userId);
    }
  });

  it('computes genuine baseline telemetry for seeded papers', async () => {
    const achillesStats = await getLiveUserStats('achilles');
    expect(achillesStats.activeTrackersCount).toBe(4);
    expect(achillesStats.userLogsCount).toBe(30);

    const hairLossStats = await getLiveUserStats('hair-loss');
    expect(hairLossStats.activeTrackersCount).toBe(4);
    expect(hairLossStats.userLogsCount).toBe(21);

    const creatineStats = await getLiveUserStats('creatine-sleep');
    expect(creatineStats.activeTrackersCount).toBe(2);
    expect(creatineStats.userLogsCount).toBe(12);

    // Unseeded ground-truth papers have 0 trackers and 0 logs
    const fastingStats = await getLiveUserStats('time-restricted-eating');
    expect(fastingStats.activeTrackersCount).toBe(0);
    expect(fastingStats.userLogsCount).toBe(0);

    const lightStats = await getLiveUserStats('light-circadian');
    expect(lightStats.activeTrackersCount).toBe(0);
    expect(lightStats.userLogsCount).toBe(0);
  });

  it('increments active trackers and logs live when a real user starts tracking and logging', async () => {
    const initialStats = await getLiveUserStats('achilles');
    const initialTrackers = initialStats.activeTrackersCount;
    const initialLogs = initialStats.userLogsCount;

    const testUser: UserRecord = {
      userId: 'test-real-user-live-sync@domain.com',
      activeRoutineId: 'achilles',
      activeProtocolId: 'achilles',
      routines: [],
      protocols: [],
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
    expect(updatedStats.activeTrackersCount).toBe(initialTrackers + 1);
    // 2 sets + 1 feedback log = 3 additional logs
    expect(updatedStats.userLogsCount).toBe(initialLogs + 3);

    // Cleanup test user from memory
    memoryUserStorage.delete(testUser.userId);
    const cleanedStats = await getLiveUserStats('achilles');
    expect(cleanedStats.activeTrackersCount).toBe(initialTrackers);
    expect(cleanedStats.userLogsCount).toBe(initialLogs);
  });
});
