'use client';

import { useMemo, useState } from 'react';
import {
  STORIES,
  filterStories,
  getStoryCategories,
  sortStoriesByDate,
  type Story,
  type StoryCategory,
} from '@/entities/story';

export type StoryCategoryFilter = 'All' | StoryCategory;
export type StorySortOrder = 'newest' | 'oldest';

export interface StoryFilters {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategory: StoryCategoryFilter;
  setSelectedCategory: (value: StoryCategoryFilter) => void;
  sortOrder: StorySortOrder;
  toggleSortOrder: () => void;
  categories: StoryCategoryFilter[];
  filteredStories: Story[];
  totalCount: number;
}

/** Archive drawer state (legacy Adventures.jsx). Lives in the showcase so filters survive collapse/expand. */
export function useStoryFilters(): StoryFilters {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StoryCategoryFilter>('All');
  const [sortOrder, setSortOrder] = useState<StorySortOrder>('newest');

  const categories = useMemo(() => getStoryCategories(STORIES), []);

  const filteredStories = useMemo(
    () =>
      sortStoriesByDate(
        filterStories(STORIES, { query: searchQuery, category: selectedCategory }),
        sortOrder,
      ),
    [searchQuery, selectedCategory, sortOrder],
  );

  const toggleSortOrder = (): void => {
    setSortOrder((p) => (p === 'newest' ? 'oldest' : 'newest'));
  };

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    toggleSortOrder,
    categories,
    filteredStories,
    totalCount: STORIES.length,
  };
}
