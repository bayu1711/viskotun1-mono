import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { authHeaders, installTestAuth } from './authTestUtils';
import { DELETE, POST } from '../../app/api/user/account/route';
import {
  getUserRecord,
  memoryUserStorage,
  saveUserRecord
} from '../userStorage';
import {
  buildUserDataExport,
  countStoredUserLogs,
  getProfileStorageKeys,
  LEGACY_LIFESTYLE_PROFILE_KEY,
  LEGACY_USER_PROFILE_KEY
} from '../../utils/accountData';
import type { Routine, RoutineRuntime } from '../../types/routine';

const TEST_USER_ID = 'usr-account-lifecycle-test';

const SAMPLE_ROUTINE = {
  id: 'achilles-test',
  title: 'Achilles Rehab Test',
  shortTitle: 'Achilles',
  currentDay: 3,
  totalDays: 14,
  steps: []
} as unknown as Routine;

const SAMPLE_RUNTIME: Record<string, RoutineRuntime> = {
  'achilles-test': {
    setsDone: { s1: 2 },
    excludedStepIds: [],
    feedbackLogs: [
      { id: 'f1', day: 1, loggedAt: '2026-11-18', score: 2, note: 'Mild stiffness' }
    ],
    morphingLogs: [],
    barrierLogs: [
      { id: 'b1', day: 2, loggedAt: '2026-11-19', barrier: 'time_crunch', barrierLabel: 'Time crunch', selectedDoseMode: 'micro' }
    ],
    doseMode: 'standard',
    pendingReEntryCheckin: false,
    lapseDays: 0,
    escalationPaused: false,
    messages: [],
    assistantTyping: false
  }
};

describe('User Account Lifecycle API & Data Utilities', () => {
  beforeAll(() => {
    installTestAuth();
  });

  it('clears all user data via POST /api/user/account while keeping account active', async () => {
    await saveUserRecord({
      userId: TEST_USER_ID,
      activeRoutineId: 'achilles-test',
      routines: [SAMPLE_ROUTINE],
      runtime: SAMPLE_RUNTIME,
      profile: { displayName: 'Test User', age: 34 },
      lifestyleProfile: {
        region: { countryCode: 'AE', countryName: 'United Arab Emirates', city: 'Dubai', detectedBy: 'user_selected', confirmed: true },
        activeTags: ['ramadan_fasting'],
        intakeCompleted: true
      },
      updatedAt: Date.now()
    });

    const req = new Request('http://localhost/api/user/account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(TEST_USER_ID) },
      body: JSON.stringify({ action: 'clear_data', userId: TEST_USER_ID })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const record = await getUserRecord(TEST_USER_ID);
    expect(record?.routines).toEqual([]);
    expect(record?.runtime).toEqual({});
    expect(record?.profile).toBeUndefined();
    expect(record?.lifestyleProfile).toBeUndefined();
    expect(record?.accountStatus).toBe('active');
  });

  it('deactivates and reactivates an account while preserving stored routines and logs', async () => {
    await saveUserRecord({
      userId: TEST_USER_ID,
      activeRoutineId: 'achilles-test',
      routines: [SAMPLE_ROUTINE],
      runtime: SAMPLE_RUNTIME,
      updatedAt: Date.now()
    });

    const deactivateRes = await POST(
      new Request('http://localhost/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(TEST_USER_ID) },
        body: JSON.stringify({ action: 'deactivate', userId: TEST_USER_ID })
      })
    );
    expect(deactivateRes.status).toBe(200);
    const deactivated = await getUserRecord(TEST_USER_ID);
    expect(deactivated?.accountStatus).toBe('deactivated');
    expect(deactivated?.deactivatedAt).toBeTypeOf('number');
    expect(deactivated?.routines).toHaveLength(1);

    const reactivateRes = await POST(
      new Request('http://localhost/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(TEST_USER_ID) },
        body: JSON.stringify({ action: 'reactivate', userId: TEST_USER_ID })
      })
    );
    expect(reactivateRes.status).toBe(200);
    const reactivated = await getUserRecord(TEST_USER_ID);
    expect(reactivated?.accountStatus).toBe('active');
    expect(reactivated?.deactivatedAt).toBeUndefined();
    expect(reactivated?.routines).toHaveLength(1);
  });

  it('permanently deletes a user account via DELETE /api/user/account', async () => {
    await saveUserRecord({
      userId: TEST_USER_ID,
      activeRoutineId: 'achilles-test',
      routines: [SAMPLE_ROUTINE],
      runtime: SAMPLE_RUNTIME,
      updatedAt: Date.now()
    });
    expect(memoryUserStorage.has(TEST_USER_ID)).toBe(true);

    const deleteRes = await DELETE(
      new Request('http://localhost/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authHeaders(TEST_USER_ID) },
        body: JSON.stringify({ userId: TEST_USER_ID })
      })
    );
    expect(deleteRes.status).toBe(200);
    const body = await deleteRes.json();
    expect(body.deleted).toBe(true);
    expect(memoryUserStorage.has(TEST_USER_ID)).toBe(false);
  });

  it('rejects unauthenticated requests with 401 and invalid actions with 400', async () => {
    const missingToken = await POST(
      new Request('http://localhost/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_data', userId: TEST_USER_ID })
      })
    );
    expect(missingToken.status).toBe(401);

    const invalidAction = await POST(
      new Request('http://localhost/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(TEST_USER_ID) },
        body: JSON.stringify({ action: 'unknown', userId: TEST_USER_ID })
      })
    );
    expect(invalidAction.status).toBe(400);
  });

  it('builds a portable JSON data export snapshot and counts stored logs accurately', () => {
    expect(countStoredUserLogs(SAMPLE_RUNTIME)).toBe(2);

    const snapshot = buildUserDataExport({
      user: {
        id: TEST_USER_ID,
        name: 'Amina',
        email: 'amina@example.com',
        initials: 'am',
        isGuest: false,
        createdAt: 1700000000000
      },
      userProfile: { displayName: 'Amina', age: 31, reminderNotificationsEnabled: true },
      lifestyleProfile: {
        region: { countryCode: 'AE', countryName: 'United Arab Emirates', city: 'Abu Dhabi', detectedBy: 'user_selected', confirmed: true },
        activeTags: ['ramadan_fasting'],
        intakeCompleted: true
      },
      routines: [SAMPLE_ROUTINE],
      runtime: SAMPLE_RUNTIME
    });

    expect(snapshot.schemaVersion).toBe('1.0');
    expect(snapshot.account?.email).toBe('amina@example.com');
    expect(snapshot.routines).toHaveLength(1);
    expect(snapshot.runtime['achilles-test'].feedbackLogs).toHaveLength(1);
  });

  it('mounts AccountControlsPanel outside the profile save form with clear, deactivate, and delete safeguards', () => {
    const profileSource = fs.readFileSync(
      path.resolve(__dirname, '../../views/Profile.tsx'),
      'utf-8'
    );
    expect(profileSource).toContain('<SegmentedTabs');
    expect(profileSource.indexOf('<SegmentedTabs')).toBeLessThan(
      profileSource.indexOf('t.backToRoutine')
    );
    // Third tab: Data & Account Controls
    expect(profileSource).toContain("'data' as const");
    expect(profileSource).toContain('t.tabs.data');
    expect(profileSource).toContain('<AccountControlsPanel />');
    expect(profileSource.indexOf('</form>')).toBeLessThan(
      profileSource.indexOf('<AccountControlsPanel />')
    );
    // AccountControlsPanel must only render on the 'data' tab, not the 'account' tab
    expect(profileSource).toContain("activeTab === 'data'");
    expect(profileSource).not.toContain("activeTab === 'account' && <AccountControlsPanel");

    const controlsSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/profile/AccountControlsPanel.tsx'),
      'utf-8'
    );
    expect(controlsSource).toContain('handleExportData');
    expect(controlsSource).toContain('handleClearAllData');
    expect(controlsSource).toContain('handleDeactivateAccount');
    expect(controlsSource).toContain('handleDeleteAccount');
    expect(controlsSource).toContain('deleteConfirmKeyword');
  });

  it('isolates profile and lifestyle localStorage keys per account so new sign-ins never inherit prior users', () => {
    const guestKeys = getProfileStorageKeys(undefined);
    const userAKeys = getProfileStorageKeys('uid-alice');
    const userBKeys = getProfileStorageKeys('uid-bob');

    expect(guestKeys.userProfile).not.toBe(LEGACY_USER_PROFILE_KEY);
    expect(guestKeys.lifestyleProfile).not.toBe(LEGACY_LIFESTYLE_PROFILE_KEY);
    expect(userAKeys.userProfile).not.toBe(userBKeys.userProfile);
    expect(userAKeys.lifestyleProfile).not.toBe(userBKeys.lifestyleProfile);
    expect(userAKeys.lifestyleProfile).not.toBe(guestKeys.lifestyleProfile);

    const authSource = fs.readFileSync(
      path.resolve(__dirname, '../../contexts/AuthContext.tsx'),
      'utf-8'
    );
    expect(authSource).toContain('getProfileStorageKeys');
    expect(authSource).toContain('loadScopedProfilesForUser');
    expect(authSource).toContain('freshAccount: true');
    expect(authSource).toContain('router.replace(ROUTES.landing)');
  });

  it('deletes only the token owner, ignoring a userId in the query string', async () => {
    const victimId = `${TEST_USER_ID}-victim`;
    await saveUserRecord({
      userId: victimId,
      activeRoutineId: 'achilles-test',
      routines: [SAMPLE_ROUTINE],
      runtime: SAMPLE_RUNTIME,
      updatedAt: Date.now()
    });

    const deleteRes = await DELETE(
      new Request(`http://localhost/api/user/account?userId=${encodeURIComponent(victimId)}`, {
        method: 'DELETE',
        headers: authHeaders(`${TEST_USER_ID}-attacker`)
      })
    );
    expect(deleteRes.status).toBe(200);
    expect(memoryUserStorage.has(victimId)).toBe(true);

    const unauthenticated = await DELETE(
      new Request(`http://localhost/api/user/account?userId=${encodeURIComponent(victimId)}`, { method: 'DELETE' })
    );
    expect(unauthenticated.status).toBe(401);
    expect(memoryUserStorage.has(victimId)).toBe(true);
    memoryUserStorage.delete(victimId);
  });
});
