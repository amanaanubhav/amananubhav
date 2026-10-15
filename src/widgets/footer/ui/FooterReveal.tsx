'use client';

import type { ReactNode } from 'react';
import { useScrollReveal } from '@/shared/lib/scroll-reveal';

export function FooterReveal({ children }: { children: ReactNode }) {
  const [ref, isVisible] = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s ease' }}>
      {children}
    </div>
  );
}
