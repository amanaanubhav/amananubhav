import { useEffect } from 'react';

/** Legacy `useEffect(() => window.scrollTo(0, 0), [])`. */
export function useScrollToTopOnMount(): void {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
