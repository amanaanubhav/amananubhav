import { useEffect } from 'react';

import { getLenis } from '@/shared/lib/smooth-scroll';

/** Legacy `useEffect(() => window.scrollTo(0, 0), [])`, now also jumping Lenis when it exists. */
export function useScrollToTopOnMount(): void {
  useEffect(() => {
    window.scrollTo(0, 0);
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, []);
}
