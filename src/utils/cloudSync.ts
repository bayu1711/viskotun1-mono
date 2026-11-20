/**
 * Cloud sync for a signed-in user's routines and runtime.
 *
 * Every save carries the server `updatedAt` this client last saw (`baseUpdatedAt`). If another
 * device saved in between, the server answers 409 with its copy; we merge both copies and
 * retry once, so logs from two devices are combined instead of the last writer winning.
 */

import { apiFetch, apiPostJson } from '../lib/apiClient';
import type { UserLifestyleProfile, UserProfile } from '../types/auth';
import type { Routine, RoutineRuntime } from '../types/routine';

export interface CloudState {
  activeRoutineId?: string;
  routines: Routine[];
  runtime: Record<string, RoutineRuntime>;
  profile?: UserProfile;
  lifestyleProfile?: UserLifestyleProfile;
}

export interface RemoteCloudState extends CloudState {
  found: boolean;
  updatedAt: number;
}

/** Last server `updatedAt` seen per user, shared by every sync call in this tab. */
const lastSeenUpdatedAt = new Map<string, number>();

export function rememberRemoteVersion(userId: string, updatedAt: number | undefined): void {
  if (typeof updatedAt === 'number' && updatedAt >= (lastSeenUpdatedAt.get(userId) ?? 0)) {
    lastSeenUpdatedAt.set(userId, updatedAt);
  }
}

export function forgetRemoteVersion(userId: string): void {
  lastSeenUpdatedAt.delete(userId);
}

function unionById<T extends { id: string }>(primary: T[] = [], secondary: T[] = []): T[] {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...secondary.filter((item) => !seen.has(item.id))];
}

/** Merges one routine's runtime: logs are combined by id; set counts keep the higher value. */
export function mergeRoutineRuntime(local: RoutineRuntime, remote: RoutineRuntime): RoutineRuntime {
  const setsDone: Record<string, number> = { ...(remote.setsDone || {}) };
  for (const [stepId, count] of Object.entries(local.setsDone || {})) {
    setsDone[stepId] = Math.max(count, setsDone[stepId] ?? 0);
  }

  return {
    ...remote,
    ...local,
    setsDone,
    feedbackLogs: unionById(remote.feedbackLogs, local.feedbackLogs),
    morphingLogs: unionById(remote.morphingLogs, local.morphingLogs),
    messages: local.messages?.length ? local.messages : remote.messages,
    lastActiveDate: [local.lastActiveDate, remote.lastActiveDate].filter(Boolean).sort().pop()
  };
}

export function mergeRuntimeRecords(
  local: Record<string, RoutineRuntime>,
  remote: Record<string, RoutineRuntime>
): Record<string, RoutineRuntime> {
  const merged: Record<string, RoutineRuntime> = { ...remote };
  for (const [id, localRuntime] of Object.entries(local)) {
    merged[id] = remote[id] ? mergeRoutineRuntime(localRuntime, remote[id]) : localRuntime;
  }
  return merged;
}

/** Local routines win on id clashes; routines only the server has are kept. */
export function mergeCloudState(local: CloudState, remote: CloudState): CloudState {
  return {
    activeRoutineId: local.activeRoutineId || remote.activeRoutineId,
    routines: unionById(local.routines, remote.routines),
    runtime: mergeRuntimeRecords(local.runtime, remote.runtime),
    profile: local.profile ?? remote.profile,
    lifestyleProfile: local.lifestyleProfile ?? remote.lifestyleProfile
  };
}

export async function fetchCloudState(userId: string): Promise<RemoteCloudState | null> {
  const res = await apiFetch('/api/user/sync');
  if (!res.ok) return null;
  const data = await res.json();
  rememberRemoteVersion(userId, data.updatedAt);
  return {
    found: Boolean(data.found),
    activeRoutineId: data.activeRoutineId,
    routines: Array.isArray(data.routines) ? data.routines : [],
    runtime: data.runtime && typeof data.runtime === 'object' ? data.runtime : {},
    profile: data.profile,
    lifestyleProfile: data.lifestyleProfile,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0
  };
}

export type PushResult =
  | { status: 'saved' }
  | { status: 'merged'; state: CloudState }
  | { status: 'failed' };

/**
 * Saves state to the cloud. `force` overwrites without a version check (used for an
 * intentional reset). On a version conflict the merged state is saved and returned so
 * the caller can show the combined data.
 */
export async function pushCloudState(
  userId: string,
  state: CloudState,
  options: { force?: boolean } = {}
): Promise<PushResult> {
  const send = (payload: CloudState) =>
    apiPostJson('/api/user/sync', {
      ...payload,
      ...(options.force ? {} : { baseUpdatedAt: lastSeenUpdatedAt.get(userId) ?? 0 })
    });

  let res = await send(state);
  if (res.ok) {
    rememberRemoteVersion(userId, (await res.json()).updatedAt);
    return { status: 'saved' };
  }

  if (res.status !== 409) return { status: 'failed' };

  const conflict = await res.json();
  const current = conflict.current as (CloudState & { updatedAt?: number }) | undefined;
  if (!current) return { status: 'failed' };

  rememberRemoteVersion(userId, current.updatedAt);
  const merged = mergeCloudState(state, {
    activeRoutineId: current.activeRoutineId,
    routines: current.routines || [],
    runtime: current.runtime || {},
    profile: current.profile,
    lifestyleProfile: current.lifestyleProfile
  });

  res = await send(merged);
  if (!res.ok) return { status: 'failed' };
  rememberRemoteVersion(userId, (await res.json()).updatedAt);
  return { status: 'merged', state: merged };
}
