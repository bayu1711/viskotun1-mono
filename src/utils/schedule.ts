import type { UserProfile } from '../types/auth';
import type { Routine, RoutineStep } from '../types/routine';
import type {
  AvailabilityMode,
  AvailableTimeWindow,
  CalendarScheduleBlock,
  RoutineScheduleMode,
  RoutineSchedulePreference,
  ScheduleCompatibilityReport,
  ScheduleCompatibilityStatus,
  StepAnchorSlot,
  StepScheduleAssignment,
  StepTiming
} from '../types/schedule';

export const DEFAULT_AVAILABLE_WINDOWS: readonly AvailableTimeWindow[] = [
  { id: 'morning', label: 'Morning', start: '07:30', end: '09:00' },
  { id: 'evening', label: 'Evening', start: '19:00', end: '21:00' }
];

const ANCHOR_SLOT_RANGES: Record<StepAnchorSlot, { start: number; end: number; label: string }> = {
  wake: { start: 4 * 60, end: 10 * 60 + 30, label: 'upon waking (04:00–10:30)' },
  morning: { start: 5 * 60, end: 12 * 60, label: 'morning (05:00–12:00)' },
  midday: { start: 11 * 60, end: 16 * 60, label: 'midday (11:00–16:00)' },
  meal: { start: 6 * 60, end: 23 * 60, label: 'around a meal' },
  evening: { start: 17 * 60, end: 23 * 60, label: 'evening (17:00–23:00)' },
  bedtime: { start: 19 * 60 + 30, end: 24 * 60, label: 'pre-bedtime (19:30–24:00)' }
};

/** Parses 24-hour HH:mm string into minutes since midnight, or null if invalid. */
export function parseTimeToMinutes(hhmm?: string): number | null {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!match) return null;
  return Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10);
}

/** Formats minutes since midnight (0–1439) to 24-hour HH:mm. */
export function formatMinutesToTime(totalMinutes: number): string {
  const clamped = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Parses HH:mm into numeric hour/minute, defaulting to 09:00. */
export function parseClockTime(hhmm?: string): { hour: number; minute: number } {
  const mins = parseTimeToMinutes(hhmm);
  if (mins === null) return { hour: 9, minute: 0 };
  return { hour: Math.floor(mins / 60), minute: mins % 60 };
}

/** Computes window duration in minutes (handles cross-midnight windows cleanly). */
export function getWindowDurationMinutes(window: Pick<AvailableTimeWindow, 'start' | 'end'>): number {
  const start = parseTimeToMinutes(window.start);
  const end = parseTimeToMinutes(window.end);
  if (start === null || end === null) return 60;
  if (end > start) return end - start;
  if (end === start) return 30;
  return 24 * 60 - start + end;
}

/** Formats a single available window range concisely (e.g. "07:30–09:00"). */
export function formatWindowRange(window: Pick<AvailableTimeWindow, 'start' | 'end'>): string {
  return `${window.start}–${window.end}`;
}

/** Sanitizes, deduplicates, and sorts available windows chronologically by start time. */
export function normalizeAvailableWindows(
  windows?: readonly AvailableTimeWindow[]
): AvailableTimeWindow[] {
  if (!Array.isArray(windows)) return [];
  const seen = new Set<string>();
  const clean: AvailableTimeWindow[] = [];

  for (const w of windows) {
    if (!w) continue;
    const startMins = parseTimeToMinutes(w.start);
    const endMins = parseTimeToMinutes(w.end);
    if (startMins === null || endMins === null) continue;
    const normStart = formatMinutesToTime(startMins);
    const normEnd =
      endMins === startMins
        ? formatMinutesToTime(Math.min(23 * 60 + 45, startMins + 60))
        : formatMinutesToTime(endMins);
    const key = `${normStart}-${normEnd}`;
    if (seen.has(key)) continue;
    seen.add(key);
    clean.push({
      id: w.id || `win-${normStart.replace(':', '')}`,
      label: w.label?.trim() || inferWindowLabel(startMins),
      start: normStart,
      end: normEnd
    });
  }

  return clean
    .sort((a, b) => (parseTimeToMinutes(a.start) ?? 0) - (parseTimeToMinutes(b.start) ?? 0))
    .slice(0, 4);
}

export function inferWindowLabel(startMinutes: number): string {
  if (startMinutes < 6 * 60 + 30) return 'Dawn';
  if (startMinutes < 11 * 60 + 30) return 'Morning';
  if (startMinutes < 16 * 60 + 30) return 'Midday';
  if (startMinutes < 20 * 60 + 30) return 'Evening';
  return 'Night';
}

/** Resolves the user's effective availability mode and windows from UserProfile. */
export function resolveProfileAvailability(userProfile?: Partial<UserProfile>): {
  mode: AvailabilityMode;
  windows: AvailableTimeWindow[];
} {
  const normalized = normalizeAvailableWindows(userProfile?.availableWindows);
  if (userProfile?.availabilityMode === 'anytime' || normalized.length === 0) {
    return { mode: 'anytime', windows: normalized };
  }
  return {
    mode: 'windows',
    windows: normalized
  };
}

/** Formats a concise human-readable availability summary for headers, chips, and Profile impact. */
export function formatAvailabilitySummary(
  userProfile?: Partial<UserProfile>,
  routineSchedule?: RoutineSchedulePreference,
  locale: 'en' | 'ar' = 'en'
): string {
  const anytimeLabel = locale === 'ar' ? 'مرن في أي وقت' : 'Flexible / Anytime';

  if (routineSchedule?.mode === 'anytime') {
    return anytimeLabel;
  }
  if (routineSchedule?.mode === 'custom_windows') {
    const custom = normalizeAvailableWindows(routineSchedule.customWindows);
    if (custom.length > 0) {
      return custom.map(formatWindowRange).join(' · ');
    }
  }

  const resolved = resolveProfileAvailability(userProfile);
  if (resolved.mode === 'anytime') {
    return anytimeLabel;
  }
  return resolved.windows.map(formatWindowRange).join(' · ');
}

/**
 * Resolves a step's clinical timing archetype.
 * Uses explicit `step.timing` when present, or deterministically infers it from
 * `frequency`, `action`, `detail`, and `durationSeconds` so every routine works seamlessly.
 */
export function resolveStepTiming(step: RoutineStep): StepTiming {
  if (step.timing?.type) {
    return {
      estimatedMinutes: estimateStepMinutes(step),
      ...step.timing
    };
  }

  const freq = (step.frequency || '').toLowerCase();
  const combined = `${step.action || ''} ${step.detail || ''} ${step.frequency || ''} ${step.statValue || ''}`.toLowerCase();
  const estimatedMinutes = estimateStepMinutes(step);

  // 1. On-demand / trigger-based (craving, urge, PRN, rescue, symptom onset)
  if (
    /\b(on urge|urge onset|when.*craving|craving hits|when.*urge|as needed|prn|on demand|rescue|episode|trigger)\b/.test(
      combined
    )
  ) {
    return {
      type: 'on_demand',
      anchorHint: 'When an urge or trigger hits',
      estimatedMinutes
    };
  }

  // 2. Continuous / all-day boundary rules (frequency cap, abstinence, throughout day, logging cap)
  if (
    /\b(frequency cap|daily cap|abstain|abstinence|throughout day|all day|daily logging|avoid smoking|no more than)\b/.test(
      combined
    )
  ) {
    return {
      type: 'continuous',
      anchorHint: 'All-day boundary · confirm daily',
      estimatedMinutes: 2
    };
  }

  // 3. Spaced multi-session (2x daily, 3x daily, morning & evening, morning & night, twice daily)
  if (
    /\b(2x\s*daily|3x\s*daily|twice\s*daily|morning\s*&\s*evening|morning\s*&\s*night|am\s*&\s*pm|split\s*dose)\b/.test(
      freq
    ) ||
    /\b(morning\s+and\s+(?:evening|night)|twice\s+daily|spaced|8\s*hours?\s*apart|12\s*hours?\s*apart)\b/.test(
      combined
    )
  ) {
    return {
      type: 'spaced',
      anchorHint: step.frequency || '2× daily (spaced ≥8h apart)',
      minSpacingHours: 8,
      estimatedMinutes
    };
  }

  // 4. Biologically / cue anchored (bedtime, sleep, wake, morning sunlight, post-dinner, post-iftar, pre-meal)
  if (/\b(before bed|before sleep|pre-bed|bedtime|nightly.*sleep|90 min.*bed)\b/.test(combined)) {
    return {
      type: 'anchored',
      anchorSlot: 'bedtime',
      anchorHint: 'Before bedtime',
      estimatedMinutes
    };
  }
  if (/\b(post-dinner|after dinner|post-iftar|after iftar|evening meal|evening)\b/.test(combined)) {
    return {
      type: 'anchored',
      anchorSlot: 'evening',
      anchorHint: /\bpost-dinner|after dinner\b/.test(combined)
        ? 'Post-dinner evening cue'
        : /\bpost-iftar|after iftar\b/.test(combined)
          ? 'Post-Iftar evening window'
          : 'Evening window',
      estimatedMinutes
    };
  }
  if (/\b(upon waking|on waking|within.*waking|pre-suhoor|dawn|morning sunlight|morning.*ingest|morning)\b/.test(combined)) {
    const isWake = /\b(upon waking|on waking|within.*waking|dawn|pre-suhoor)\b/.test(combined);
    return {
      type: 'anchored',
      anchorSlot: isWake ? 'wake' : 'morning',
      anchorHint: isWake ? 'Upon waking / early morning' : 'Morning window',
      estimatedMinutes
    };
  }
  if (/\b(with meal|pre-meal|post-meal|after lunch|midday|breakfast)\b/.test(combined)) {
    return {
      type: 'anchored',
      anchorSlot: 'meal',
      anchorHint: 'Paired with a meal',
      estimatedMinutes
    };
  }

  // 5. Default: Flexible session-based
  return {
    type: 'flexible',
    anchorHint: step.frequency || 'Flexible daily',
    estimatedMinutes
  };
}

export function estimateStepMinutes(step: RoutineStep): number {
  if (step.timing?.estimatedMinutes && step.timing.estimatedMinutes > 0) {
    return step.timing.estimatedMinutes;
  }
  if (step.durationSeconds && step.durationSeconds > 0) {
    const totalSec = step.durationSeconds * Math.max(1, step.sets || 1);
    return Math.max(2, Math.ceil(totalSec / 60));
  }
  if (step.reps && step.reps > 1) {
    // ~4 seconds per rep + short rest per set
    return Math.max(5, Math.ceil((step.reps * Math.max(1, step.sets || 1) * 5) / 60));
  }
  return 5;
}

export function isOnDemandStep(step: RoutineStep): boolean {
  return resolveStepTiming(step).type === 'on_demand';
}

export function isContinuousStep(step: RoutineStep): boolean {
  return resolveStepTiming(step).type === 'continuous';
}

function windowOverlapsSlot(window: AvailableTimeWindow, slot: StepAnchorSlot): boolean {
  const start = parseTimeToMinutes(window.start);
  const end = parseTimeToMinutes(window.end);
  if (start === null || end === null) return true;
  const target = ANCHOR_SLOT_RANGES[slot];
  const effectiveEnd = end > start ? end : 24 * 60;
  return start < target.end && effectiveEnd > target.start;
}

function findSpacedWindowPair(
  windows: readonly AvailableTimeWindow[],
  minSpacingHours: number
): [AvailableTimeWindow, AvailableTimeWindow] | null {
  const minGapMinutes = minSpacingHours * 60;
  if (windows.length >= 2) {
    for (let i = 0; i < windows.length; i++) {
      const startA = parseTimeToMinutes(windows[i].start);
      if (startA === null) continue;
      for (let j = i + 1; j < windows.length; j++) {
        const endB = parseTimeToMinutes(windows[j].end);
        const startB = parseTimeToMinutes(windows[j].start);
        if (startB === null || endB === null) continue;
        // Measure achievable separation between earliest point in A and latest useful point in B
        const achievableGap = Math.max(startB - startA, endB - startA - 15);
        if (achievableGap >= minGapMinutes) {
          return [windows[i], windows[j]];
        }
      }
    }
  }

  // Also check if a single wide open window can accommodate both sessions spaced apart
  for (const w of windows) {
    if (getWindowDurationMinutes(w) >= minGapMinutes + 30) {
      return [w, w];
    }
  }

  return null;
}

/**
 * Evaluates how well a research paper's extracted step timing rules fit the user's
 * global availability (or per-routine schedule override) and builds concrete calendar blocks.
 */
export function evaluateRoutineScheduleCompatibility(
  routine: Routine,
  userProfile?: Partial<UserProfile>,
  routineSchedule?: RoutineSchedulePreference,
  excludedStepIds: readonly string[] = []
): ScheduleCompatibilityReport {
  const activeSteps = routine.steps.filter((s) => !excludedStepIds.includes(s.id));
  const profileAvail = resolveProfileAvailability(userProfile);

  const effectiveMode: RoutineScheduleMode =
    routineSchedule?.mode ??
    (profileAvail.mode === 'anytime' ? 'anytime' : 'profile_windows');

  const activeWindows: AvailableTimeWindow[] =
    effectiveMode === 'anytime'
      ? []
      : effectiveMode === 'custom_windows'
        ? normalizeAvailableWindows(routineSchedule?.customWindows)
        : profileAvail.windows;

  const isAnytime = effectiveMode === 'anytime' || activeWindows.length === 0;

  const stepAssignments: StepScheduleAssignment[] = [];
  const issues: string[] = [];
  let hasConflict = false;
  let hasTight = false;

  const resolvedTimings = activeSteps.map((step) => ({
    step,
    timing: resolveStepTiming(step)
  }));

  const hasOnDemandSteps = resolvedTimings.some((t) => t.timing.type === 'on_demand');
  const hasContinuousSteps = resolvedTimings.some((t) => t.timing.type === 'continuous');
  const hasScheduledSteps = resolvedTimings.some(
    (t) => t.timing.type === 'flexible' || t.timing.type === 'spaced' || t.timing.type === 'anchored'
  );
  const hasFlexibleOnlySteps =
    activeSteps.length > 0 && resolvedTimings.every((t) => t.timing.type === 'flexible');

  // Track calendar block grouping by clock start (hour:minute)
  const blockMap = new Map<string, CalendarScheduleBlock>();

  const registerCalendarBlock = (
    key: string,
    label: string,
    startHhmm: string,
    durationMinutes: number,
    stepId: string
  ) => {
    const existing = blockMap.get(key);
    if (existing) {
      if (!existing.stepIds.includes(stepId)) {
        existing.stepIds.push(stepId);
        existing.durationMinutes = Math.min(90, existing.durationMinutes + Math.max(5, durationMinutes));
      }
      return;
    }
    const { hour, minute } = parseClockTime(startHhmm);
    blockMap.set(key, {
      id: key,
      label,
      hour,
      minute,
      durationMinutes: Math.max(10, Math.min(90, durationMinutes)),
      stepIds: [stepId]
    });
  };

  for (const { step, timing } of resolvedTimings) {
    const estMins = timing.estimatedMinutes ?? 10;

    if (timing.type === 'on_demand') {
      stepAssignments.push({
        stepId: step.id,
        timing,
        status: 'on_demand',
        assignedLabel: timing.anchorHint ? `${timing.anchorHint} · Anytime` : 'On trigger · Anytime',
        assignedWindows: []
      });
      continue;
    }

    if (timing.type === 'continuous') {
      const checkInWindow = activeWindows[activeWindows.length - 1];
      stepAssignments.push({
        stepId: step.id,
        timing,
        status: 'continuous',
        assignedLabel: checkInWindow
          ? `All-day rule · check in ${formatWindowRange(checkInWindow)}`
          : 'All-day rule · confirm daily',
        assignedWindows: checkInWindow ? [checkInWindow] : []
      });
      continue;
    }

    if (timing.type === 'flexible') {
      if (isAnytime) {
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'anytime',
          assignedLabel: 'Anytime today',
          assignedWindows: []
        });
        continue;
      }

      const fittingWindow =
        activeWindows.find((w) => getWindowDurationMinutes(w) >= estMins) ?? activeWindows[0];
      const duration = getWindowDurationMinutes(fittingWindow);

      if (duration >= estMins) {
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'fits',
          assignedLabel: `${fittingWindow.label} (${formatWindowRange(fittingWindow)})`,
          assignedWindows: [fittingWindow]
        });
      } else {
        hasTight = true;
        const issue = `"${step.action}" takes ~${estMins} min, while your ${fittingWindow.label} window is ${duration} min. Micro-Dose mode or extending that window can bridge busy days.`;
        issues.push(issue);
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'tight',
          assignedLabel: `${fittingWindow.label} (${formatWindowRange(fittingWindow)}) · tight fit`,
          assignedWindows: [fittingWindow],
          issue
        });
      }

      registerCalendarBlock(
        `win-${fittingWindow.start}`,
        fittingWindow.label,
        fittingWindow.start,
        estMins,
        step.id
      );
      continue;
    }

    if (timing.type === 'spaced') {
      const minGap = timing.minSpacingHours ?? 8;
      if (isAnytime) {
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'anytime',
          assignedLabel: `Flexible · space sessions ≥${minGap}h apart`,
          assignedWindows: []
        });
        continue;
      }

      const pair = findSpacedWindowPair(activeWindows, minGap);
      if (pair) {
        const [first, second] = pair;
        const sameWideWindow = first.id === second.id;
        const label = sameWideWindow
          ? `${first.label} (2 spaced sessions ≥${minGap}h apart)`
          : `${formatWindowRange(first)} & ${formatWindowRange(second)}`;

        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'fits',
          assignedLabel: label,
          assignedWindows: sameWideWindow ? [first] : [first, second]
        });

        registerCalendarBlock(`win-${first.start}`, `${first.label} (Session 1)`, first.start, estMins, step.id);
        if (sameWideWindow) {
          const secondStart = formatMinutesToTime((parseTimeToMinutes(first.start) ?? 480) + minGap * 60);
          registerCalendarBlock(`win-${secondStart}`, `${first.label} (Session 2)`, secondStart, estMins, step.id);
        } else {
          registerCalendarBlock(`win-${second.start}`, `${second.label} (Session 2)`, second.start, estMins, step.id);
        }
      } else {
        hasConflict = true;
        const windowList = activeWindows.map(formatWindowRange).join(', ');
        const issue = `"${step.action}" requires spaced sessions (≥${minGap}h apart), which cannot safely fit inside your current availability (${windowList}). Add a second spaced window for this routine or switch it to flexible timing.`;
        issues.push(issue);
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'conflict',
          assignedLabel: `Needs 2 windows ≥${minGap}h apart`,
          assignedWindows: activeWindows.slice(0, 1),
          issue
        });
        // Still attach primary window for fallback calendar block if exported
        if (activeWindows[0]) {
          registerCalendarBlock(
            `win-${activeWindows[0].start}`,
            activeWindows[0].label,
            activeWindows[0].start,
            estMins,
            step.id
          );
        }
      }
      continue;
    }

    if (timing.type === 'anchored') {
      const slot: StepAnchorSlot = timing.anchorSlot ?? 'morning';
      const slotMeta = ANCHOR_SLOT_RANGES[slot];

      if (isAnytime) {
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'anytime',
          assignedLabel: timing.anchorHint ? `Anchor: ${timing.anchorHint}` : `Anchor: ${slotMeta.label}`,
          assignedWindows: []
        });
        continue;
      }

      const matchingWindow = activeWindows.find((w) => windowOverlapsSlot(w, slot));
      if (matchingWindow) {
        const duration = getWindowDurationMinutes(matchingWindow);
        if (duration < estMins) {
          hasTight = true;
          const issue = `"${step.action}" (~${estMins} min) is tight inside your ${matchingWindow.label} window (${duration} min).`;
          issues.push(issue);
          stepAssignments.push({
            stepId: step.id,
            timing,
            status: 'tight',
            assignedLabel: `${matchingWindow.label} (${formatWindowRange(matchingWindow)}) · tight fit`,
            assignedWindows: [matchingWindow],
            issue
          });
        } else {
          stepAssignments.push({
            stepId: step.id,
            timing,
            status: 'fits',
            assignedLabel: `${matchingWindow.label} (${formatWindowRange(matchingWindow)})`,
            assignedWindows: [matchingWindow]
          });
        }
        registerCalendarBlock(
          `win-${matchingWindow.start}`,
          matchingWindow.label,
          matchingWindow.start,
          estMins,
          step.id
        );
      } else {
        hasConflict = true;
        const windowList = activeWindows.map(formatWindowRange).join(', ');
        const cue = timing.anchorHint || slotMeta.label;
        const issue = `"${step.action}" is clinically anchored to ${cue}, which does not overlap your open window(s) (${windowList}). Add a custom ${slot} window for this routine or proceed flexibly.`;
        issues.push(issue);
        stepAssignments.push({
          stepId: step.id,
          timing,
          status: 'conflict',
          assignedLabel: `Requires ${cue}`,
          assignedWindows: [],
          issue
        });
      }
    }
  }

  let status: ScheduleCompatibilityStatus;
  let headline: string;
  let explanation: string;

  if (hasConflict) {
    status = 'conflict';
    headline = 'Schedule conflict with your current availability';
    explanation = issues[0] || 'One or more clinical timing rules do not fit your listed open windows.';
  } else if (hasTight) {
    status = 'tight';
    headline = 'Tight fit for your listed windows';
    explanation = issues[0] || 'Some sessions are slightly longer than your available slot; Micro-Dose mode can help.';
  } else if (isAnytime) {
    status = 'flexible_anytime';
    headline = hasOnDemandSteps
      ? 'Flexible & trigger-based timing'
      : 'Flexible anytime routine';
    explanation = hasOnDemandSteps
      ? 'On-demand tools stay available whenever urges strike, with no fixed clock slots forced.'
      : 'No fixed clock windows required — check off steps whenever they fit your day.';
  } else {
    status = 'compatible';
    headline = hasOnDemandSteps
      ? 'Fits your windows + anytime triggers'
      : 'Fits your available windows';
    const blockLabels = Array.from(blockMap.values())
      .map((b) => `${b.label} (${formatMinutesToTime(b.hour * 60 + b.minute)})`)
      .join(' · ');
    explanation = hasOnDemandSteps
      ? `Scheduled steps map cleanly to your availability${blockLabels ? ` (${blockLabels})` : ''}; trigger-based steps stay anytime on demand.`
      : blockLabels
        ? `Mapped cleanly to ${blockLabels}.`
        : 'All daily steps fit comfortably within your available windows.';
  }

  const recommendedDefaultMode: RoutineScheduleMode =
    hasFlexibleOnlySteps && profileAvail.mode === 'anytime'
      ? 'anytime'
      : effectiveMode;

  const calendarBlocks = Array.from(blockMap.values()).sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)
  );

  return {
    status,
    effectiveMode,
    headline,
    explanation,
    stepAssignments,
    issues,
    hasFlexibleOnlySteps,
    hasScheduledSteps,
    hasOnDemandSteps,
    hasContinuousSteps,
    recommendedDefaultMode,
    calendarBlocks
  };
}

/**
 * Convenience helper for Calendar export (.ics / Google Calendar).
 * Returns concrete scheduled blocks (skipping on_demand and continuous steps).
 * If a routine is set to 'anytime' or has only trigger/continuous steps, falls back
 * to a single daily check-in block using the user's last available window (or 20:00).
 */
export function buildCalendarBlocksForRoutine(
  routine: Routine,
  userProfile?: Partial<UserProfile>,
  routineSchedule?: RoutineSchedulePreference
): { blocks: CalendarScheduleBlock[]; isCheckInFallback: boolean } {
  const report = evaluateRoutineScheduleCompatibility(routine, userProfile, routineSchedule);
  if (report.calendarBlocks.length > 0) {
    return { blocks: report.calendarBlocks, isCheckInFallback: false };
  }

  const profileAvail = resolveProfileAvailability(userProfile);
  const fallbackWindow =
    routineSchedule?.mode === 'custom_windows' && routineSchedule.customWindows?.length
      ? routineSchedule.customWindows[0]
      : profileAvail.windows[profileAvail.windows.length - 1];

  const { hour, minute } = fallbackWindow
    ? parseClockTime(fallbackWindow.start)
    : { hour: 20, minute: 0 };

  return {
    isCheckInFallback: true,
    blocks: [
      {
        id: 'daily-checkin',
        label: report.hasOnDemandSteps || report.hasContinuousSteps ? 'Daily Check-in' : 'Daily Routine',
        hour,
        minute,
        durationMinutes: 15,
        stepIds: routine.steps.map((s) => s.id)
      }
    ]
  };
}
