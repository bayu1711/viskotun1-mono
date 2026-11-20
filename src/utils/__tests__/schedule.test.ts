import { describe, expect, it } from 'vitest';
import { achillesRoutine } from '../../data/routines/achilles';
import {
  dualNBackRoutine,
  plantarFasciitisRoutine,
  uaeHeatCircadianRoutine,
  uaeMidwakhTaperingRoutine,
  warmBathSleepRoutine
} from '../../data/routines/calibrated';
import type { UserProfile } from '../../types/auth';
import type { RoutineStep } from '../../types/routine';
import { generateIcsCalendar } from '../calendar';
import { completionOf } from '../routineMetrics';
import {
  buildCalendarBlocksForRoutine,
  evaluateRoutineScheduleCompatibility,
  formatAvailabilitySummary,
  resolveProfileAvailability,
  resolveStepTiming
} from '../schedule';

const MORNING_ONLY_PROFILE: UserProfile = {
  availabilityMode: 'windows',
  availableWindows: [{ id: 'morning', label: 'Morning', start: '07:00', end: '08:30' }]
};

const EVENING_ONLY_PROFILE: UserProfile = {
  availabilityMode: 'windows',
  availableWindows: [{ id: 'evening', label: 'Evening', start: '19:00', end: '20:30' }]
};

const SPLIT_WINDOWS_PROFILE: UserProfile = {
  availabilityMode: 'windows',
  availableWindows: [
    { id: 'morning', label: 'Morning', start: '07:30', end: '09:00' },
    { id: 'evening', label: 'Evening', start: '19:30', end: '21:30' }
  ]
};

describe('Schedule Compatibility & Timing Archetypes', () => {
  it('lets a flexible exercise routine run Anytime alongside a time-anchored smoking cessation routine', () => {
    const exerciseReport = evaluateRoutineScheduleCompatibility(
      plantarFasciitisRoutine,
      SPLIT_WINDOWS_PROFILE,
      { mode: 'anytime' }
    );
    expect(exerciseReport.status).toBe('flexible_anytime');
    expect(exerciseReport.hasFlexibleOnlySteps).toBe(true);
    expect(exerciseReport.calendarBlocks).toHaveLength(0);

    const cessationReport = evaluateRoutineScheduleCompatibility(
      uaeMidwakhTaperingRoutine,
      SPLIT_WINDOWS_PROFILE,
      { mode: 'profile_windows' }
    );
    expect(cessationReport.status).toBe('compatible');
    expect(cessationReport.hasOnDemandSteps).toBe(true);
    expect(cessationReport.hasContinuousSteps).toBe(true);

    const urgeStep = cessationReport.stepAssignments.find((s) => s.stepId === 'midwakh-1');
    const capStep = cessationReport.stepAssignments.find((s) => s.stepId === 'midwakh-2');
    const dinnerStep = cessationReport.stepAssignments.find((s) => s.stepId === 'midwakh-3');

    expect(urgeStep?.status).toBe('on_demand');
    expect(urgeStep?.assignedWindows).toHaveLength(0);
    expect(capStep?.status).toBe('continuous');
    expect(dinnerStep?.status).toBe('fits');
    expect(dinnerStep?.assignedWindows[0]?.label).toBe('Evening');

    // Calendar export only schedules the anchored evening step, never fake craving blocks
    const { blocks, isCheckInFallback } = buildCalendarBlocksForRoutine(
      uaeMidwakhTaperingRoutine,
      SPLIT_WINDOWS_PROFILE
    );
    expect(isCheckInFallback).toBe(false);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].stepIds).toEqual(['midwakh-3']);
  });

  it('does not penalize daily completion when zero smoking cravings occur on an on_demand step', () => {
    // Only midwakh-2 (1 set continuous cap) and midwakh-3 (2 sets post-dinner) are required daily;
    // midwakh-1 (on_demand urge surfing) stays at 0 and still yields 100% completion.
    const fullWithoutCravings = completionOf(uaeMidwakhTaperingRoutine, {
      'midwakh-1': 0,
      'midwakh-2': 1,
      'midwakh-3': 2
    });
    expect(fullWithoutCravings).toBe(1);

    const partial = completionOf(uaeMidwakhTaperingRoutine, {
      'midwakh-1': 3,
      'midwakh-2': 0,
      'midwakh-3': 0
    });
    expect(partial).toBe(0);
  });

  it('flags a schedule conflict for 2x/day spaced routines when the user only has one narrow window', () => {
    const conflictReport = evaluateRoutineScheduleCompatibility(
      achillesRoutine,
      EVENING_ONLY_PROFILE
    );
    expect(conflictReport.status).toBe('conflict');
    expect(conflictReport.issues.length).toBeGreaterThan(0);
    expect(conflictReport.issues[0]).toContain('≥8h apart');

    // Resolving via per-routine custom windows fixes the conflict cleanly
    const resolvedReport = evaluateRoutineScheduleCompatibility(
      achillesRoutine,
      EVENING_ONLY_PROFILE,
      {
        mode: 'custom_windows',
        customWindows: [
          { id: 'am', label: 'Morning', start: '07:30', end: '08:15' },
          { id: 'pm', label: 'Evening', start: '19:00', end: '20:00' }
        ]
      }
    );
    expect(resolvedReport.status).toBe('compatible');
    expect(resolvedReport.calendarBlocks).toHaveLength(2);

    // Multi-block .ics calendar produces two distinct VEVENT entries
    const ics = generateIcsCalendar(achillesRoutine, {
      blocks: resolvedReport.calendarBlocks,
      startDate: new Date(2026, 4, 10)
    });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it('flags a schedule conflict when an anchored biological step does not overlap user windows', () => {
    const morningSunConflict = evaluateRoutineScheduleCompatibility(
      uaeHeatCircadianRoutine,
      EVENING_ONLY_PROFILE
    );
    expect(morningSunConflict.status).toBe('conflict');
    expect(
      morningSunConflict.stepAssignments.find((a) => a.stepId === 'heat-1')?.status
    ).toBe('conflict');

    const bedtimeConflict = evaluateRoutineScheduleCompatibility(
      warmBathSleepRoutine,
      MORNING_ONLY_PROFILE
    );
    expect(bedtimeConflict.status).toBe('conflict');
    expect(bedtimeConflict.stepAssignments.every((a) => a.status === 'conflict')).toBe(true);
  });

  it('flags a tight fit when a flexible session exceeds the available window duration', () => {
    const shortWindowProfile: UserProfile = {
      availabilityMode: 'windows',
      availableWindows: [{ id: 'quick', label: 'Quick Morning', start: '08:00', end: '08:10' }]
    };

    const report = evaluateRoutineScheduleCompatibility(dualNBackRoutine, shortWindowProfile);
    expect(report.status).toBe('tight');
    expect(report.stepAssignments[0]?.status).toBe('tight');
  });

  it('deterministically infers step timing archetypes when step.timing is omitted', () => {
    const cravingStep: RoutineStep = {
      id: 's1',
      tone: 'mint',
      icon: 'check',
      action: 'Urge Surfing Breathwork',
      detail: 'Use whenever a cigarette craving hits',
      sets: 3,
      reps: 1,
      frequency: 'On urge onset'
    };
    const spacedStep: RoutineStep = {
      id: 's2',
      tone: 'orange',
      icon: 'pill',
      action: 'Oral Supplement',
      detail: 'Take morning and night',
      sets: 2,
      reps: 1,
      frequency: '2x Daily'
    };
    const bedtimeStep: RoutineStep = {
      id: 's3',
      tone: 'lavender',
      icon: 'sleep',
      action: 'Wind-down Stretch',
      detail: 'Perform 30 min before bed',
      sets: 1,
      reps: 1,
      frequency: '1x Nightly'
    };

    expect(resolveStepTiming(cravingStep).type).toBe('on_demand');
    expect(resolveStepTiming(spacedStep).type).toBe('spaced');
    expect(resolveStepTiming(bedtimeStep)).toMatchObject({
      type: 'anchored',
      anchorSlot: 'bedtime'
    });
  });

  it('defaults unset or empty availability profiles to Flexible / Anytime rather than hardcoded clock windows', () => {
    expect(resolveProfileAvailability(undefined)).toEqual({ mode: 'anytime', windows: [] });
    expect(resolveProfileAvailability({})).toEqual({ mode: 'anytime', windows: [] });
    expect(resolveProfileAvailability({ availabilityMode: 'windows', availableWindows: [] })).toEqual({
      mode: 'anytime',
      windows: []
    });
    expect(formatAvailabilitySummary({})).toBe('Flexible / Anytime');
    expect(formatAvailabilitySummary({}, undefined, 'ar')).toBe('مرن في أي وقت');
  });
});
