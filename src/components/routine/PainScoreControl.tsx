import React, { useId } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { motion } from 'framer-motion';
import { MOTION, PAIN_SCORE_MAX, PAIN_SCORE_MIN, PAIN_SCORE_STEP } from '../../data/config';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { clampPainScore } from '../../utils/protocolMetrics';
import type { PainTone } from '../../utils/tones';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

interface PainScoreControlProps {
  score: number;
  tone: PainTone;
  onChange: (score: number) => void;
}

/** Stepper + slider for picking a 0–10 pain score. */
export function PainScoreControl({ score, tone, onChange }: PainScoreControlProps) {
  const sliderId = useId();
  const fillRatio = (score - PAIN_SCORE_MIN) / (PAIN_SCORE_MAX - PAIN_SCORE_MIN);
  const stepBy = (delta: number) => onChange(clampPainScore(score + delta));

  return (
    <>
      <div className="mt-8 flex items-center justify-center gap-7">
        <CircleButton
          label={COPY.painDrawer.decrease}
          onClick={() => stepBy(-PAIN_SCORE_STEP)}
          disabled={score === PAIN_SCORE_MIN}
          size={36}>
          
          <Icon icon={RemoveIcon} size="md" />
        </CircleButton>
        <p aria-live="polite" className="w-24 text-center text-giant font-light leading-none tabular-nums">
          {score}
        </p>
        <CircleButton
          label={COPY.painDrawer.increase}
          variant="solid"
          onClick={() => stepBy(PAIN_SCORE_STEP)}
          disabled={score === PAIN_SCORE_MAX}
          size={36}>
          
          <Icon icon={AddIcon} size="md" />
        </CircleButton>
      </div>
      <p className="mt-3 text-center text-2xl lowercase">
        {COPY.painDrawer.ofMax(PAIN_SCORE_MAX)} <span className="text-sm text-ink/45">/ {tone.label}</span>
      </p>

      <label htmlFor={sliderId} className="sr-only">
        {COPY.painDrawer.sliderLabel(PAIN_SCORE_MIN, PAIN_SCORE_MAX)}
      </label>
      <div className={cn('relative mt-7 flex items-center', tone.accent)}>
        <div aria-hidden="true" className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full w-full origin-left bg-current"
            initial={false}
            animate={{ scaleX: fillRatio }}
            transition={MOTION.fade} />
          
        </div>
        <input
          id={sliderId}
          type="range"
          min={PAIN_SCORE_MIN}
          max={PAIN_SCORE_MAX}
          step={PAIN_SCORE_STEP}
          value={score}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={COPY.painDrawer.sliderValue(score, PAIN_SCORE_MAX, tone.label)}
          className="pain-slider relative w-full bg-transparent" />
        
      </div>
      <div className="mt-2 flex justify-between text-xs lowercase text-ink/45">
        <span>{COPY.painDrawer.minLabel(PAIN_SCORE_MIN)}</span>
        <span>{COPY.painDrawer.maxLabel(PAIN_SCORE_MAX)}</span>
      </div>
    </>);

}