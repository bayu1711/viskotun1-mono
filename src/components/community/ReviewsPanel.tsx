'use client';

import React, { useEffect, useState } from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import type { LocaleCopy } from '../../data/locales/types';
import { reviewFilters } from '../../data/reviewFilters';
import type { ReviewFilter, CommunityReview } from '../../types/routine';
import { EmptyState } from '../feedback/EmptyState';
import { FilterChips } from '../ui/FilterChips';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';
import { SectionHeading } from '../ui/SectionHeading';
import { ReviewCard } from './ReviewCard';

import { useLocale } from '../../contexts/LocaleContext';
type CohortFilter = 'all' | 'smoker' | 'non_smoker' | 'ramadan' | 'shift_work';

const COHORT_FILTER_OPTIONS = (copy: LocaleCopy): { id: CohortFilter; label: string }[] => [
  { id: 'all', label: copy.lifestyleTuning.filterAll },
  { id: 'smoker', label: copy.lifestyleTuning.filterSmokers },
  { id: 'non_smoker', label: copy.lifestyleTuning.filterNonSmokers },
  { id: 'ramadan', label: copy.lifestyleTuning.filterRamadan },
  { id: 'shift_work', label: copy.lifestyleTuning.filterShiftWork }
];

export function ReviewsPanel() {
  const { copy } = useLocale();
  const { routine, openReviewDrawer } = useRoutine();
  const targetRoutine = routine;
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [cohortFilter, setCohortFilter] = useState<CohortFilter>('all');
  const [liveReviews, setLiveReviews] = useState<CommunityReview[]>(
    targetRoutine?.community?.reviews || []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sync when active routine changes or live reviews are fetched from Firestore
  useEffect(() => {
    let isMounted = true;
    if (!targetRoutine?.id) return;

    // Fast sync from local routine state first
    setLiveReviews(targetRoutine.community?.reviews || []);

    async function fetchLiveReviews() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/community/reviews?routineId=${encodeURIComponent(targetRoutine.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.reviews) && data.reviews.length > 0) {
            setLiveReviews(data.reviews);
          }
        }
      } catch (err) {
        console.warn('[ReviewsPanel] Failed to fetch live Firestore reviews, using cached baseline:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLiveReviews();

    return () => {
      isMounted = false;
    };
  }, [targetRoutine?.id, targetRoutine?.community?.reviews]);

  const reviews = liveReviews.filter((review) => {
    const outcomeMatch = filter === 'all' || review.outcome === filter;
    if (!outcomeMatch) return false;

    if (cohortFilter === 'all') return true;
    if (review.lifestyleCohort === cohortFilter) return true;

    const lowerText = review.text.toLowerCase();
    const lowerHandle = (review.handle || '').toLowerCase();
    const tags = review.tags || [];

    if (cohortFilter === 'smoker') {
      return (
        tags.includes('smoker') ||
        lowerText.includes('smok') ||
        lowerText.includes('shisha') ||
        lowerText.includes('dokha') ||
        lowerText.includes('midwakh') ||
        lowerHandle.includes('smok')
      );
    }
    if (cohortFilter === 'ramadan') {
      return (
        tags.includes('ramadan') ||
        lowerText.includes('ramadan') ||
        lowerText.includes('fasting') ||
        lowerHandle.includes('fasting')
      );
    }
    if (cohortFilter === 'shift_work') {
      return (
        tags.includes('shift_work') ||
        lowerText.includes('shift') ||
        lowerText.includes('night') ||
        lowerHandle.includes('shift')
      );
    }
    if (cohortFilter === 'non_smoker') {
      return (
        review.lifestyleCohort === 'non_smoker' ||
        (!lowerText.includes('smok') && !lowerText.includes('shisha') && !lowerText.includes('midwakh'))
      );
    }

    return true;
  });

  return (
    <Panel aria-label={copy.community.reviewsLabel}>
      <SectionHeading
        eyebrow={copy.community.reviewsEyebrow}
        title={copy.community.reviewsTitle}
        action={
          <PillButton size="sm" onClick={openReviewDrawer}>
            {copy.community.shareAction}
          </PillButton>
        }
      />
      <div className="mt-4 space-y-2">
        <FilterChips
          options={reviewFilters}
          value={filter}
          onChange={setFilter}
          ariaLabel={copy.community.filterLabel}
        />
        <FilterChips
          options={COHORT_FILTER_OPTIONS(copy)}
          value={cohortFilter}
          onChange={setCohortFilter}
          ariaLabel="Filter reviews by participant lifestyle cohort"
        />
      </div>

      {isLoading && liveReviews.length === 0 ? (
        <div className="mt-4 space-y-2">
          <div className="h-20 w-full animate-pulse rounded-tile bg-canvas" />
          <div className="h-20 w-full animate-pulse rounded-tile bg-canvas" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState className="mt-4" title={copy.community.emptyReviews} />
      ) : (
        <ul className="mt-4 space-y-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
      )}
    </Panel>
  );
}