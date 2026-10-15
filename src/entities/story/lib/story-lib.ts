import type { Story, StoryCategory } from '../model/types';

/** Legacy `ADVENTURES.slice(0, 3)`. */
export function getFeaturedStories(stories: readonly Story[], count: number = 3): Story[] {
  return stories.slice(0, count);
}

/** Legacy `['All', ...new Set(ADVENTURES.map(s => s.category))]` (first-seen order). */
export function getStoryCategories(stories: readonly Story[]): ('All' | StoryCategory)[] {
  return ['All', ...new Set(stories.map((s) => s.category))];
}

/** Case-insensitive title/subtitle match plus exact category match ('All' matches every story). */
export function filterStories(
  stories: readonly Story[],
  filters: { query: string; category: 'All' | StoryCategory },
): Story[] {
  const query = filters.query.toLowerCase();
  return stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(query) || story.subtitle.toLowerCase().includes(query);
    const matchesCategory = filters.category === 'All' || story.category === filters.category;
    return matchesSearch && matchesCategory;
  });
}

/**
 * Returns a sorted copy. Same semantics as the legacy `new Date(b.date) - new Date(a.date)`
 * comparator, including NaN for unparseable labels such as "Recent Adventure".
 */
export function sortStoriesByDate(stories: readonly Story[], order: 'newest' | 'oldest'): Story[] {
  return [...stories].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'newest' ? dateB - dateA : dateA - dateB;
  });
}

/** Card label, e.g. "annapurna-circuit-solo" -> "LOG_ANNAPURNA". */
export function getStoryLogLabel(id: string): string {
  return `LOG_${id.split('-')[0].toUpperCase()}`;
}

/** Shared layoutIds for the card -> reader morph. */
export function storyLayoutIds(id: string): { container: string; image: string; title: string } {
  return {
    container: `story-image-container-${id}`,
    image: `story-image-${id}`,
    title: `story-title-${id}`,
  };
}
