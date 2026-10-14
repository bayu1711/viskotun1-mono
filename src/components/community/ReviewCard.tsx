import React from 'react';
import { COPY } from '../../data/copy';
import type { CommunityReview, ReviewOutcome } from '../../types/protocol';
import { cn } from '../../utils/cn';

const OUTCOME_DOT: Record<ReviewOutcome, string> = {
  improved: 'bg-mint',
  adjusted: 'bg-cream',
  paused: 'bg-blush'
};

interface ReviewCardProps {
  review: CommunityReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <li>
      <article className="rounded-tile border border-ink p-4">
        <div className="flex items-center gap-2 text-xs lowercase text-ink/45">
          <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-full ring-1 ring-ink/20', OUTCOME_DOT[review.outcome])} />
          {COPY.community.reviewMeta(review.outcome, review.day)}
          <span className="ml-auto">{COPY.community.reviewAdherence(review.adherence)}</span>
        </div>
        <blockquote className="mt-2.5 text-body leading-relaxed">“{review.text}”</blockquote>
        <p className="mt-2 text-xs text-ink/40">{review.handle}</p>
      </article>
    </li>);

}