/**
 * Scheduling & Availability Contracts for TrialN1.
 *
 * Separates two concerns cleanly:
 * 1. Global User Availability (`AvailabilityMode` + `AvailableTimeWindow[]` on UserProfile)
 * 2. Clinical Step Timing Archetypes (`StepTiming` on RoutineStep) & per-routine overrides (`RoutineSchedulePreference` on RoutineRuntime)
 */

export type AvailabilityMode = 'windows' | 'anytime';

export interface AvailableTimeWindow {
  id: string;
  label: string;
  /** 24-hour HH:mm start time (e.g. "07:30"). */
  start: string;
  /** 24-hour HH:mm end time (e.g. "09:00"). */
  end: string;
}

export type StepTimingType = 'flexible' | 'spaced' | 'anchored' | 'on_demand' | 'continuous';

export type StepAnchorSlot = 'wake' | 'morning' | 'midday' | 'meal' | 'evening' | 'bedtime';

export interface StepTiming {
  type: StepTimingType;
  /** Concise clinical cue from the paper (e.g. "When a craving hits", "90 min before sleep", "2x daily >=8h apart"). */
  anchorHint?: string;
  /** Biological/circadian anchor bucket for 'anchored' steps so compatibility checks can verify window overlap. */
  anchorSlot?: StepAnchorSlot;
  /** Minimum hours between sessions for 'spaced' multi-session steps (e.g. 8). */
  minSpacingHours?: number;
  /** Estimated minutes required per session (used to verify window fit). */
  estimatedMinutes?: number;
}

export type RoutineScheduleMode = 'profile_windows' | 'anytime' | 'custom_windows';

export interface RoutineSchedulePreference {
  mode: RoutineScheduleMode;
  customWindows?: AvailableTimeWindow[];
  acknowledgedConflict?: boolean;
}

export type ScheduleCompatibilityStatus =
  | 'compatible'
  | 'tight'
  | 'conflict'
  | 'flexible_anytime';

export interface StepScheduleAssignment {
  stepId: string;
  timing: StepTiming;
  status: 'fits' | 'tight' | 'conflict' | 'anytime' | 'on_demand' | 'continuous';
  /** Human-readable slot assignment or cue (e.g. "07:30–09:00 & 19:00–21:00", "On craving · Anytime"). */
  assignedLabel: string;
  /** Assigned window(s) if mapped to concrete clock ranges. */
  assignedWindows: AvailableTimeWindow[];
  /** Specific explanation when status is 'tight' or 'conflict'. */
  issue?: string;
}

export interface CalendarScheduleBlock {
  id: string;
  label: string;
  hour: number;
  minute: number;
  durationMinutes: number;
  stepIds: string[];
}

export interface ScheduleCompatibilityReport {
  status: ScheduleCompatibilityStatus;
  effectiveMode: RoutineScheduleMode;
  headline: string;
  explanation: string;
  stepAssignments: StepScheduleAssignment[];
  issues: string[];
  hasFlexibleOnlySteps: boolean;
  hasScheduledSteps: boolean;
  hasOnDemandSteps: boolean;
  hasContinuousSteps: boolean;
  recommendedDefaultMode: RoutineScheduleMode;
  calendarBlocks: CalendarScheduleBlock[];
}
