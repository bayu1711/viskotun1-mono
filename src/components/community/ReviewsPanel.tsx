import React, { useState } from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { reviewFilters } from '../../data/reviewFilters';
import type { ReviewFilter } from '../../types/protocol';
import { EmptyState } from '../feedback/EmptyState';
import { FilterChips } from '../ui/FilterChips';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';
import { ReviewCard } from './ReviewCard';

export function ReviewsPanel() {
  const { protocol } = useProtocol();
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const allReviews = protocol.community.reviews;
  const reviews = filter === 'all' ? allReviews : allReviews.filter((review) => review.outcome === filter);

  return (
    <Panel aria-label={COPY.community.reviewsLabel}>
      <SectionHeading eyebrow={COPY.community.reviewsEyebrow} title={COPY.community.reviewsTitle} />
      <FilterChips
        className="mt-4"
        options={reviewFilters}
        value={filter}
        onChange={setFilter}
        ariaLabel={COPY.community.filterLabel} />
      

      {reviews.length === 0 ?
      <EmptyState className="mt-4" title={COPY.community.emptyReviews} /> :

      <ul className="mt-4 space-y-2">
          {reviews.map((review) =>
        <ReviewCard key={review.id} review={review} />
        )}
        </ul>
      }
    </Panel>);

}