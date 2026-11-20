'use client';

import React, { useMemo, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useLocale } from '../../../contexts/LocaleContext';
import { COPY } from '../../../data/copy';
import type { UserProfile } from '../../../types/auth';
import type { Routine, RoutineStep } from '../../../types/routine';
import type {
  AvailableTimeWindow,
  RoutineScheduleMode,
  RoutineSchedulePreference
} from '../../../types/schedule';
import { cn } from '../../../utils/cn';
import { isRandomizedTrial, stopRuleOf } from '../../../utils/routineMetrics';
import {
  evaluateRoutineScheduleCompatibility,
  normalizeAvailableWindows,
  resolveProfileAvailability,
  resolveStepTiming
} from '../../../utils/schedule';
import { Callout } from '../../feedback/Callout';
import { MissingDataBanner } from '../../routine/MissingDataBanner';
import { AIIcon } from '../../ui/AIIcon';
import { AvailableWindowsEditor } from '../../ui/AvailableWindowsEditor';
import { EvidenceBadgeChip } from '../../ui/EvidenceBadgeChip';
import { Icon } from '../../ui/Icon';
import { MetaItem } from './MetaItem';

interface CandidateRoutineCardProps {
  routine: Routine;
  userProfile?: UserProfile;
  onConfirm: (scheduleOverride?: RoutineSchedulePreference) => void;
  onDiscard: () => void;
  onToggleExcludeStep?: (stepId: string) => void;
  onAskAboutStep?: (step: RoutineStep) => void;
}

export function CandidateRoutineCard({
  routine,
  userProfile,
  onConfirm,
  onDiscard,
  onToggleExcludeStep,
  onAskAboutStep
}: CandidateRoutineCardProps) {
  const { copy } = useLocale();
  const sCopy = copy.schedule;
  const pCopy = copy.profile;

  const targetRoutine = routine;
  const paper = targetRoutine.paper;
  const stopRule = stopRuleOf(targetRoutine);
  const progressionRule = targetRoutine.progressionRules?.[0];
  const excludedIds = useMemo(
    () => targetRoutine.initialExcludedStepIds ?? [],
    [targetRoutine.initialExcludedStepIds]
  );

  const profileAvail = useMemo(() => resolveProfileAvailability(userProfile), [userProfile]);

  const [scheduleMode, setScheduleMode] = useState<RoutineScheduleMode>(() =>
    profileAvail.mode === 'anytime' ? 'anytime' : 'profile_windows'
  );
  const [customWindows, setCustomWindows] = useState<AvailableTimeWindow[]>(() =>
    profileAvail.windows
  );

  const draftSchedule: RoutineSchedulePreference = useMemo(
    () => ({
      mode: scheduleMode,
      ...(scheduleMode === 'custom_windows'
        ? { customWindows: normalizeAvailableWindows(customWindows) }
        : {})
    }),
    [scheduleMode, customWindows]
  );

  const compatibility = useMemo(
    () => evaluateRoutineScheduleCompatibility(targetRoutine, userProfile, draftSchedule, excludedIds),
    [targetRoutine, userProfile, draftSchedule, excludedIds]
  );

  const assignmentByStepId = useMemo(
    () => new Map(compatibility.stepAssignments.map((a) => [a.stepId, a])),
    [compatibility.stepAssignments]
  );

  const meta = [
    { label: COPY.assistant.meta.sample, value: COPY.assistant.meta.sampleValue(paper.sampleSize) },
    {
      label: COPY.assistant.meta.design,
      value: isRandomizedTrial(paper) ? COPY.evidence.rctShort : COPY.evidence.pilotShort
    },
    { label: COPY.assistant.meta.year, value: String(paper.year) }
  ];

  const handleConfirmClick = () => {
    const finalSchedule: RoutineSchedulePreference = {
      ...draftSchedule,
      ...(compatibility.status === 'conflict' ? { acknowledgedConflict: true } : {})
    };
    onConfirm(finalSchedule);
  };

  const statusToneClass =
    compatibility.status === 'conflict'
      ? 'border-orange/40 bg-orange/15 text-ink'
      : compatibility.status === 'tight'
        ? 'border-ink/20 bg-cream text-ink'
        : 'border-mint bg-mint/45 text-ink';

  return (
    <article className="rounded-card border border-ink/10 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-0.5 text-xs font-medium text-ink">
            <AIIcon size="xs" />
            {COPY.assistant.stagingEyebrow}
          </span>
          <span className="inline-flex items-center rounded-full bg-cream border border-ink/15 px-2 py-0.5 text-3xs font-semibold text-ink">
            v{targetRoutine.version || '1.0'}
          </span>
        </div>
        <span className="text-2xs text-ink/60 font-mono">
          {targetRoutine.phase || 'Clinical Research'} · {targetRoutine.totalDays} days
        </span>
      </div>

      {targetRoutine.isCanonical && (
        <div className="rounded-tile border border-ink/15 bg-cream/70 p-3 text-xs text-ink space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <AIIcon size="xs" />
            <span>{COPY.assistant.existingCanonicalPill(targetRoutine.version || '1.0')}</span>
          </div>
          <p className="text-2xs text-ink/75 leading-relaxed">
            {COPY.assistant.existingCanonicalNotice(targetRoutine.version || '1.0')}
          </p>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold leading-snug text-ink">{paper.title || targetRoutine.title}</h3>
        <p className="mt-1 text-xs text-ink/60">
          {paper.authors} · {paper.journal}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-bubble bg-canvas p-3 border border-ink/5">
        {meta.map((item) => (
          <MetaItem key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>

      {paper.evidenceBadges && paper.evidenceBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {paper.evidenceBadges.map((badge) => (
            <EvidenceBadgeChip key={badge} badge={badge} />
          ))}
        </div>
      )}

      {/* Missing Parameters / Lineage Banner */}
      <MissingDataBanner routine={targetRoutine} className="rounded-tile text-xs" />

      {targetRoutine.dataCollectionSpec?.some(
        (field) => field.proposedWidget?.status === 'pending_review'
      ) && (
        <div
          role="status"
          className="rounded-tile border border-ink/15 bg-mint/40 p-3 text-xs text-ink space-y-1"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <AIIcon size="xs" />
            <span>{COPY.morphing.widgets.custom.pendingNotice}</span>
          </div>
          <p className="text-2xs text-ink/70">
            {COPY.morphing.widgets.custom.pendingSubtext}
          </p>
        </div>
      )}

      {targetRoutine.steps && targetRoutine.steps.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-ink/10">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink/60">
            {COPY.assistant.candidateStepsTitle}
          </p>
          <ul className="space-y-2.5">
            {targetRoutine.steps.map((step, idx) => {
              const isExcluded = excludedIds.includes(step.id);
              const timing = resolveStepTiming(step);
              const assignment = assignmentByStepId.get(step.id);
              return (
                <li
                  key={step.id || idx}
                  className={cn(
                    'rounded-tile border border-ink/10 p-2.5 transition-opacity',
                    isExcluded ? 'bg-canvas/40 opacity-60' : 'bg-canvas/70'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-2xs font-bold',
                        isExcluded ? 'bg-ink/5 text-ink/60' : 'bg-ink/10 text-ink'
                      )}
                    >
                      {timing.type === 'on_demand' ? 'PRN' : `${step.sets}×`}
                    </span>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className={cn('font-medium text-ink', isExcluded && 'line-through text-ink/60')}>
                          {step.action}
                        </p>
                        {isExcluded && (
                          <span className="rounded bg-ink/10 px-1 py-0.2 text-3xs text-ink/60">
                            {COPY.task.excludedBadge}
                          </span>
                        )}
                      </div>
                      {step.detail && <p className="mt-0.5 text-2xs text-ink/60">{step.detail}</p>}
                      {!isExcluded && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-3xs font-medium',
                              assignment?.status === 'conflict'
                                ? 'border-orange/50 bg-orange/15 text-ink'
                                : timing.type === 'on_demand'
                                  ? 'border-ink/15 bg-mint/45 text-ink'
                                  : 'border-ink/10 bg-white text-ink/75'
                            )}
                          >
                            <Icon icon={ScheduleOutlinedIcon} size="xs" />
                            <span>{sCopy.archetypeLabels[timing.type]}</span>
                            {assignment?.assignedLabel && (
                              <span className="text-ink/60">· {assignment.assignedLabel}</span>
                            )}
                          </span>
                        </div>
                      )}
                      {step.inferred && (
                        <p className="mt-1 text-3xs text-ink/60">
                          {step.inferredProvenance?.tier === 'lineage'
                            ? COPY.task.lineageBadge(step.inferredProvenance.source)
                            : COPY.task.inferredBadge(step.inferredProvenance?.source)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onAskAboutStep && (
                        <button
                          type="button"
                          onClick={() => onAskAboutStep(step)}
                          aria-label={COPY.task.helpAriaLabel(step.action)}
                          title={COPY.task.helpTooltip(step.action)}
                          className="relative flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 bg-white text-ink/60 transition-colors before:absolute before:-inset-2.5 hover:border-ink hover:bg-mint hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        >
                          <Icon icon={HelpOutlineOutlinedIcon} size="xs" />
                        </button>
                      )}
                      {step.inferred && onToggleExcludeStep && (
                        <button
                          type="button"
                          onClick={() => onToggleExcludeStep(step.id)}
                          className="text-3xs text-ink/60 underline decoration-dotted hover:text-ink transition-colors"
                          title={isExcluded ? COPY.task.restoreStep : COPY.missingData.candidateExclusionNotice}
                        >
                          {isExcluded ? COPY.assistant.restoreCandidateStep : COPY.assistant.excludeCandidateStep}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Pre-Start Schedule Compatibility Gate & Per-Routine Mode Picker */}
      <div className={cn('rounded-tile border p-3.5 space-y-2.5', statusToneClass)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Icon
              icon={compatibility.status === 'conflict' ? WarningAmberOutlinedIcon : ScheduleOutlinedIcon}
              size="xs"
            />
            <span>{sCopy.statusBadges[compatibility.status]}</span>
          </div>
          <span className="text-3xs font-medium uppercase tracking-wider text-ink/60">
            {sCopy.eyebrow}
          </span>
        </div>

        <p className="text-2xs leading-relaxed text-ink/80">{compatibility.explanation}</p>

        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {(['profile_windows', 'anytime', 'custom_windows'] as const).map((modeOption) => (
            <button
              key={modeOption}
              type="button"
              onClick={() => setScheduleMode(modeOption)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-3xs font-medium transition-colors cursor-pointer',
                scheduleMode === modeOption
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/20 bg-white/90 text-ink/80 hover:border-ink'
              )}
            >
              {sCopy.modeLabels[modeOption]}
            </button>
          ))}
        </div>

        {scheduleMode === 'custom_windows' && (
          <div className="space-y-1.5 pt-1">
            <AvailableWindowsEditor
              windows={customWindows}
              onChange={setCustomWindows}
              presets={pCopy.availabilityPresets}
              addLabel={pCopy.addWindowBtn}
              labelPlaceholder={pCopy.windowLabelPlaceholder}
              removeAria={pCopy.removeWindowAria}
              compact
            />
            <p className="text-3xs text-ink/65">{sCopy.customWindowHint}</p>
          </div>
        )}
      </div>

      {stopRule && (
        <Callout
          tone="cream"
          icon={<Icon icon={WarningAmberOutlinedIcon} size="sm" className="mt-0.5 text-ink/75" />}
          className="rounded-tile text-xs"
        >
          {stopRule.text}
        </Callout>
      )}

      {progressionRule && (
        <p className="text-2xs text-ink/60 px-1">
          {COPY.routineCard.rulePrefix} {COPY.routineCard.ruleCondition(progressionRule.condition)} {COPY.routineCard.ruleArrow}{' '}
          <span className="font-medium text-ink">{progressionRule.action.toLowerCase()}</span>
        </p>
      )}

      <div className="pt-2 border-t border-ink/10 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink cursor-pointer"
          >
            <Icon icon={CheckIcon} size="xs" />
            <span>
              {compatibility.status === 'conflict'
                ? sCopy.conflictProceedBtn
                : targetRoutine.isCanonical
                  ? COPY.assistant.adoptExistingRoutine
                  : COPY.assistant.confirmAddPaper}
            </span>
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="flex items-center gap-1 rounded-full border border-ink/20 px-3 py-2.5 text-xs font-medium text-ink/65 hover:bg-ink/5 hover:text-ink transition-colors focus:outline-none cursor-pointer"
          >
            <Icon icon={CloseIcon} size="xs" />
            <span>{COPY.assistant.discardCandidate}</span>
          </button>
        </div>

        {onAskAboutStep && (
          <button
            type="button"
            onClick={() => {
              onAskAboutStep({
                id: 'improvement',
                action: COPY.assistant.proposeImprovementPrompt
              } as unknown as RoutineStep);
            }}
            className="w-full text-center text-2xs font-medium text-ink/65 hover:text-ink underline decoration-dotted transition-colors py-1"
          >
            {COPY.assistant.proposeImprovementButton}
          </button>
        )}
      </div>

      <p className="text-center text-3xs text-ink/60">
        {COPY.assistant.stagingDescription}
      </p>
    </article>
  );
}
