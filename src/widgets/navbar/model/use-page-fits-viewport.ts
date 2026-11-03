'use client';

import { useEffect, useState } from 'react';

/**
 * True while the document is no taller than the viewport (e.g. /admin-chat). Such a page has no scroll to hide the
 * navbar on, and motion's `scrollYProgress` reads 1 when the scroll length is 0, which `useHideOnScroll` takes for a
 * scroll down past the top: without this the bar would hide at mount and never come back.
 */
export function usePageFitsViewport(pathname: string): boolean {
  const [fits, setFits] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    const check = () => setFits(el.scrollHeight - el.clientHeight <= 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(document.body);
    window.addEventListener('resize', check);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [pathname]);

  return fits;
}
