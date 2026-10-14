import type { ReviewFilter } from '../types/protocol';
import { COPY } from './copy';

export const reviewFilters: {id: ReviewFilter;label: string;}[] = [
{ id: 'all', label: COPY.community.filters.all },
{ id: 'improved', label: COPY.community.filters.improved },
{ id: 'adjusted', label: COPY.community.filters.adjusted },
{ id: 'paused', label: COPY.community.filters.paused }];