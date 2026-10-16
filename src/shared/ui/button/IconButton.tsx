import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name (also the native tooltip). */
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  /** Toggle state; sets `aria-pressed` and draws a 2 px signal rule at the bottom edge. */
  pressed?: boolean;
  /** 40 or 44 CSS px; touch pointers always get at least 44 px. Default 44. */
  size?: 40 | 44;
  variant?: 'ghost' | 'outline';
  className?: string;
}

const VARIANTS = {
  ghost: 'border border-transparent',
  outline: 'border border-line-strong',
} as const;

/** Square icon-only button (§D.3, §B.10 secondary/icon states). Server-safe; give it an `onClick` from a client parent. */
export function IconButton({
  label,
  icon: Icon,
  pressed,
  size = 44,
  variant = 'ghost',
  className,
  type,
  title,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      aria-label={label}
      title={title ?? label}
      aria-pressed={pressed}
      {...rest}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control bg-transparent text-ink',
        'transition-[background-color,border-color,color,transform] duration-hover ease-settle',
        'hover:bg-surface-2 active:scale-[0.98] active:duration-micro',
        'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal',
        'aria-pressed:border-ink aria-pressed:bg-surface-2 aria-pressed:shadow-[inset_0_-2px_0_rgb(var(--c-signal))]',
        'aria-expanded:border-ink aria-expanded:bg-surface-2',
        'disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted disabled:hover:bg-transparent disabled:active:scale-100',
        size === 40 ? 'size-10 [@media(pointer:coarse)]:size-11' : 'size-11',
        VARIANTS[variant],
        className,
      )}
    >
      <Icon aria-hidden="true" focusable="false" className="size-5" strokeWidth={1.75} />
    </button>
  );
}
