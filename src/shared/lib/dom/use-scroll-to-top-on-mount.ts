import { useEffect } from 'react';

import { getLenis } from '@/shared/lib/smooth-scroll';

import { isHistoryTraversal } from './history-traversal';

/**
 * Legacy `useEffect(() => window.scrollTo(0, 0), [])`, now also jumping Lenis when it exists.
 * A new navigation starts at the top (§J.4 #2); a Back/Forward arrival keeps the position the
 * browser restores (§J.4 #16), so the reset is skipped then.
 */
export function useScrollToTopOnMount(): void {
  useEffect(() => {
    if (isHistoryTraversal()) return;
    window.scrollTo(0, 0);
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, []);
}
