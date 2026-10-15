'use client';

import type { ReactNode } from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '@/shared/lib/cn';

export interface BackgroundGradientProps {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}

// Keyframes kept verbatim from the legacy component (including the "0, 50%" value).
const variants: Variants = {
  initial: {
    backgroundPosition: '0 50%',
  },
  animate: {
    backgroundPosition: ['0, 50%', '100% 50%', '0 50%'],
  },
};


export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
}: BackgroundGradientProps) {
  const transition = animate
    ? {
        duration: 5,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      }
    : undefined;

  return (
    <div className={cn('relative p-[1px] group', containerClassName)}>
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={transition}
        style={{
          backgroundSize: animate ? '400% 400%' : undefined,
        }}
        className={cn(
          'absolute inset-0 rounded-[1.75rem] z-[1] opacity-60 group-hover:opacity-100 blur-xl ease-out transition duration-500 will-change-transform',
          'bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]',
        )}
      />
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? 'initial' : undefined}
        animate={animate ? 'animate' : undefined}
        transition={transition}
        style={{
          backgroundSize: animate ? '400% 400%' : undefined,
        }}
        className={cn(
          'absolute inset-0 rounded-[1.75rem] z-[1] will-change-transform',
          'bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]',
        )}
      />

      <div className={cn('relative z-10', className)}>{children}</div>
    </div>
  );
}
