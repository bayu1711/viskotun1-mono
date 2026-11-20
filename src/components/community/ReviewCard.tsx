import React from 'react';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined';
import SmokingRoomsOutlinedIcon from '@mui/icons-material/SmokingRoomsOutlined';
import { COPY } from '../../data/copy';
import type { CommunityReview, ReviewOutcome } from '../../types/routine';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

const OUTCOME_CONFIG: Record<ReviewOutcome, { dot: string; card: string }> = {
  improved: { dot: 'bg-mint', card: 'border-mint/50 bg-mint/10' },
  adjusted: { dot: 'bg-yellow', card: 'border-yellow/50 bg-yellow/10' },
  paused: { dot: 'bg-peach', card: 'border-peach/50 bg-peach/10' }
};

interface ReviewCardProps {
  review: CommunityReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const config = OUTCOME_CONFIG[review.outcome];

  return (
    <li>
      <article className={cn('rounded-tile border p-4 transition-colors', config.card)}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink/65">
          <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full ring-1 ring-ink/20', config.dot)} />
          <span className="font-medium text-ink">{COPY.community.reviewMeta(review.outcome, review.day)}</span>
          {review.lifestyleCohort === 'smoker' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-peach/30 px-2 py-0.5 text-3xs font-medium text-ink">
              <Icon icon={SmokingRoomsOutlinedIcon} size="xs" />
              <span>Smoker / Shisha</span>
            </span>
          )}
          {review.lifestyleCohort === 'ramadan' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint/40 px-2 py-0.5 text-3xs font-medium text-ink">
              <Icon icon={NightsStayOutlinedIcon} size="xs" />
              <span>Ramadan Fasting</span>
            </span>
          )}
          {review.lifestyleCohort === 'shift_work' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-0.5 text-3xs font-medium text-ink">
              <Icon icon={LocalHospitalOutlinedIcon} size="xs" />
              <span>Shift Work</span>
            </span>
          )}
          <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-3xs font-semibold text-ink/70">
            {COPY.community.reviewAdherence(review.adherence)}
          </span>
        </div>
        <blockquote className="mt-2.5 text-body leading-relaxed text-ink/90">“{review.text}”</blockquote>
        <p className="mt-2 text-xs text-ink/60">{review.handle}</p>
      </article>
    </li>
  );
}