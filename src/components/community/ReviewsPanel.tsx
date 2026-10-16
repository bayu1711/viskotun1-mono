'use client';

import React, { useEffect, useState } from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { reviewFilters } from '../../data/reviewFilters';
import type { ReviewFilter, CommunityReview } from '../../types/routine';
import { EmptyState } from '../feedback/EmptyState';
import { FilterChips } from '../ui/FilterChips';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';
import { SectionHeading } from '../ui/SectionHeading';
import { ReviewCard } from './ReviewCard';

export function ReviewsPanel() {
  const { routine, protocol = routine, openReviewDrawer } = useRoutine();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [liveReviews, setLiveReviews] = useState<CommunityReview[]>(
    routine?.community?.reviews || []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sync when active protocol changes or live reviews are fetched from Firestore
  useEffect(() => {
    let isMounted = true;
    if (!protocol?.id) return;

    // Fast sync from local protocol state first
    setLiveReviews(protocol.community?.reviews || []);

    async function fetchLiveReviews() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/community/reviews?routineId=${encodeURIComponent(protocol.id)}`);
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
  }, [protocol?.id, protocol?.community?.reviews]);

  const reviews =
    filter === 'all'
      ? liveReviews
      : liveReviews.filter((review) => review.outcome === filter);

  return (
    <Panel aria-label={COPY.community.reviewsLabel}>
      <SectionHeading
        eyebrow={COPY.community.reviewsEyebrow}
        title={COPY.community.reviewsTitle}
        action={
          <PillButton size="sm" onClick={openReviewDrawer}>
            {COPY.community.shareAction}
          </PillButton>
        }
      />
      <FilterChips
        className="mt-4"
        options={reviewFilters}
        value={filter}
        onChange={setFilter}
        ariaLabel={COPY.community.filterLabel}
      />

      {isLoading && liveReviews.length === 0 ? (
        <div className="mt-4 space-y-2">
          <div className="h-20 w-full animate-pulse rounded-tile bg-canvas" />
          <div className="h-20 w-full animate-pulse rounded-tile bg-canvas" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState className="mt-4" title={COPY.community.emptyReviews} />
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