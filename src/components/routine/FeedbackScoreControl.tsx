import React, { useId } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { motion } from 'framer-motion';
import {
  FEEDBACK_SCORE_MAX,
  FEEDBACK_SCORE_MIN,
  FEEDBACK_SCORE_STEP,
  MOTION
} from '../../data/config';
import { COPY } from '../../data/copy';
import type { FeedbackMetric } from '../../types/routine';
import { cn } from '../../utils/cn';
import { clampFeedbackScore } from '../../utils/routineMetrics';
import type { SeverityTone } from '../../utils/tones';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

interface FeedbackScoreControlProps {
  score: number;
  tone: SeverityTone;
  onChange: (score: number) => void;
  metric?: FeedbackMetric;
}

/** Stepper + slider for picking a subjective feedback score. */
export function FeedbackScoreControl({ score, tone, onChange, metric }: FeedbackScoreControlProps) {
  const sliderId = useId();
  const maxScore = metric?.maxScore ?? FEEDBACK_SCORE_MAX;
  const minScore = FEEDBACK_SCORE_MIN;
  const metricName = metric?.name ?? COPY.feedbackDrawer.defaultMetricName;
  const fillRatio = (score - minScore) / (maxScore - minScore);
  const stepBy = (delta: number) => onChange(clampFeedbackScore(score + delta, maxScore, minScore));

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-7">
        <CircleButton
          label={COPY.feedbackDrawer.decreaseMetric(metricName)}
          onClick={() => stepBy(-FEEDBACK_SCORE_STEP)}
          disabled={score === minScore}
          size={36}
        >
          <Icon icon={RemoveIcon} size="md" />
        </CircleButton>
        <p aria-live="polite" className="w-24 text-center text-giant font-light leading-none tabular-nums">
          {score}
        </p>
        <CircleButton
          label={COPY.feedbackDrawer.increaseMetric(metricName)}
          variant="solid"
          onClick={() => stepBy(FEEDBACK_SCORE_STEP)}
          disabled={score === maxScore}
          size={36}
        >
          <Icon icon={AddIcon} size="md" />
        </CircleButton>
      </div>
      <p className="mt-3 text-center text-2xl">
        {COPY.feedbackDrawer.ofMax(maxScore)} <span className="text-sm text-ink/45">/ {tone.label}</span>
      </p>

      <label htmlFor={sliderId} className="sr-only">
        {COPY.feedbackDrawer.metricSliderLabel(metricName, minScore, maxScore)}
      </label>
      <div className={cn('relative mt-7 flex items-center', tone.accent)}>
        <div aria-hidden="true" className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full w-full origin-left bg-current"
            initial={false}
            animate={{ scaleX: fillRatio }}
            transition={MOTION.fade}
          />
        </div>
        <input
          id={sliderId}
          type="range"
          min={minScore}
          max={maxScore}
          step={FEEDBACK_SCORE_STEP}
          value={score}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={COPY.feedbackDrawer.sliderValue(score, maxScore, tone.label)}
          className="feedback-slider relative w-full bg-transparent"
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink/45">
        <span>{metric?.minLabel ?? COPY.feedbackDrawer.minLabel(minScore)}</span>
        <span>{metric?.maxLabel ?? COPY.feedbackDrawer.maxLabel(maxScore)}</span>
      </div>
    </>
  );
}
