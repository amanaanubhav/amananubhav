'use client';

import type { Story } from '@/entities/story';
import { createStore } from '@/shared/lib/store';

const storyReaderStore = createStore<Story | null>(null);

export function openStory(story: Story): void {
  storyReaderStore.set(story);
}

export function closeStory(): void {
  storyReaderStore.set(null);
}

export function useSelectedStory(): Story | null {
  return storyReaderStore.use();
}
