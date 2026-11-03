'use client';

import type { Story } from '@/entities/story';
import { createStore } from '@/shared/lib/store';

const storyReaderStore = createStore<Story | null>(null);

/**
 * What opened the reader (the card or archive row), captured before the state change: the shell makes `<main>`
 * inert in the same commit that mounts the reader, which drops focus to `<body>` before the reader can read it.
 */
let opener: HTMLElement | null = null;

export function openStory(story: Story): void {
  const active = typeof document === 'undefined' ? null : document.activeElement;
  opener = active instanceof HTMLElement && active !== document.body ? active : null;
  storyReaderStore.set(story);
}

export function closeStory(): void {
  storyReaderStore.set(null);
}

/**
 * The element that opened the current story; the reader reads it on mount to return focus on close. Read, not
 * consumed, so a Strict Mode re-run of the reader's effect still finds it; the next `openStory()` replaces it.
 */
export function storyOpener(): HTMLElement | null {
  return opener;
}

export function useSelectedStory(): Story | null {
  return storyReaderStore.use();
}
