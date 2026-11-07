import { useEffect } from 'react';
import { isHistoryTraversal } from '@/shared/lib/dom';
import { getLenis } from '@/shared/lib/smooth-scroll';

function hashTargetExists(): boolean {
  const raw = window.location.hash.slice(1);
  if (!raw) return false;
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {
    // keep the raw id
  }
  return document.getElementById(id) !== null;
}

/**
 * `useScrollToTopOnMount` for /stories: a new navigation starts at the top (§J.4 #2) and a Back/Forward arrival keeps
 * the restored position (§J.4 #16), as before. A URL that names a place on the page (`/stories#dodital`, `#pack`) also
 * keeps the browser's or the router's jump to it: the reset used to run after that jump, so every deep link landed on
 * the hero (NOTEBOOK-DESIGN §1.5).
 */
export function useTopUnlessDeepLink(): void {
  useEffect(() => {
    if (isHistoryTraversal() || hashTargetExists()) return;
    window.scrollTo(0, 0);
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, []);
}
