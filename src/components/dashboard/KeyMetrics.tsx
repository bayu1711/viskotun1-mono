import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { cn } from '../../utils/cn';
import {
  complianceLevel,
  isRandomizedTrial,
  progressionStatus
} from '../../utils/routineMetrics';
import { formatPhaseLabel } from '../../utils/text';
import { Icon } from '../ui/Icon';

/** State colors carry meaning only; every dot is paired with its caption text. */
type MetricState = 'good' | 'watch' | 'stop' | 'neutral';

const STATE_DOT: Record<MetricState, string> = {
  good: 'bg-success',
  watch: 'bg-warning',
  stop: 'bg-danger',
  neutral: 'bg-ink/30'
};

interface Metric {
  label: string;
  value: string;
  caption: string;
  state: MetricState;
  icon: SvgIconComponent;
  /** Optional 0–1 bar under the value (day progress). */
  fraction?: number;
}

/**
 * The four numbers that answer "how am I doing?" as one ruled panel: calm type, hairline
 * dividers, and color reserved for state. Replaces four saturated big-number tiles, which
 * PRODUCT.md lists as an anti-reference. The routine name already sits in the switcher above,
 * so the first cell shows where you are in it instead.
 */
export function KeyMetrics() {
  const { copy } = useLocale();
  const { routine, adherenceRate, currentDay, totalDays, progressionReady, escalationPaused } = useRoutine();
  const status = progressionStatus(escalationPaused, progressionReady);
  const compliance = complianceLevel(adherenceRate);
  const isRct = isRandomizedTrial(routine.paper);

  const metrics: Metric[] = [
    {
      label: copy.dashboard.activeRoutine,
      value: copy.shell.dayOfTotal(currentDay, totalDays),
      caption: copy.shareableSummary.timelineProgress,
      state: 'neutral',
      icon: CalendarTodayOutlinedIcon,
      fraction: totalDays > 0 ? Math.min(1, currentDay / totalDays) : 0
    },
    {
      label: copy.dashboard.adherence,
      value: `${adherenceRate}${copy.common.percentSign}`,
      caption: copy.dashboard.compliance[compliance],
      state: compliance === 'high' ? 'good' : compliance === 'moderate' ? 'watch' : 'stop',
      icon: TrendingUpIcon
    },
    {
      label: copy.dashboard.currentPhase,
      value: formatPhaseLabel(routine.phaseLabel),
      caption: copy.dashboard.phase[status],
      state: status === 'paused' ? 'stop' : status === 'ready' ? 'good' : 'neutral',
      icon: TimelineIcon
    },
    {
      label: copy.dashboard.evidenceScore,
      value: isRct ? copy.evidence.high : copy.evidence.moderate,
      caption: copy.dashboard.evidenceCaption(
        isRct ? copy.evidence.rctShort : copy.evidence.pilotShort,
        routine.paper.sampleSize
      ),
      state: isRct ? 'good' : 'watch',
      icon: ScienceOutlinedIcon
    }
  ];

  return (
    <section
      aria-label={copy.dashboard.metricsLabel}
      className="mt-6 grid grid-cols-2 overflow-hidden rounded-panel border border-ink/10 bg-white lg:grid-cols-4"
    >
      {metrics.map((metric, index) => (
        <article
          key={metric.label}
          className={cn(
            'flex min-w-0 flex-col gap-3 p-4 sm:p-5',
            // Hairline rules between cells: a 2×2 grid on phones, one row from lg.
            index % 2 === 1 && 'border-s border-ink/10',
            index >= 2 && 'border-t border-ink/10 lg:border-t-0',
            index === 2 && 'lg:border-s'
          )}
        >
          <h2 className="flex items-center gap-1.5 text-xs font-medium text-ink/70">
            <Icon icon={metric.icon} size="xs" className="shrink-0" />
            <span className="truncate">{metric.label}</span>
          </h2>
          <p className="truncate text-2xl font-medium leading-none tracking-tight tabular-nums text-ink sm:text-[1.75rem]">
            {metric.value}
          </p>
          {metric.fraction !== undefined && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
              <div
                className="h-full origin-left rounded-full bg-ink rtl:origin-right"
                style={{ transform: `scaleX(${metric.fraction})` }}
              />
            </div>
          )}
          <p className="mt-auto flex items-center gap-1.5 text-xs text-ink/80">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', STATE_DOT[metric.state])} aria-hidden="true" />
            <span className="truncate">{metric.caption}</span>
          </p>
        </article>
      ))}
    </section>
  );
}
