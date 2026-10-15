'use client';

import { useState } from 'react';
import { useMotionValueEvent, useScroll } from 'motion/react';

/** Visible at the top (<5% progress) and on scroll up; hidden on scroll down. */
export function useHideOnScroll(): boolean {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(true);

  useMotionValueEvent(scrollYProgress, 'change', (current) => {
    if (typeof current === 'number') {
      const previous = scrollYProgress.getPrevious() ?? current;
      const direction = current - previous;

      if (scrollYProgress.get() < 0.05) {
        setVisible(true); // Show at top
      } else if (direction < 0) {
        setVisible(true); // Show on scroll up
      } else {
        setVisible(false); // Hide on scroll down
      }
    }
  });

  return visible;
}
