import { clsx } from 'clsx';
import { buttonClassName } from '@/shared/ui/button';

/*
 * The sky's control sizes (FINAL-DESIGN §4.2.4): 40 px tools on fine pointers, 44 px on coarse ones (P0-3), on the
 * site's one button (`buttonClassName`: satin steel secondary, action primary, pressed = action-soft + rule, press
 * scale, the global focus ring).
 */
const TOOL = 'h-10 px-4 [@media(pointer:coarse)]:h-11';

export function skyButton(variant: 'secondary' | 'primary' = 'secondary', extra?: string): string {
  return buttonClassName({ variant, className: clsx(TOOL, extra) });
}

export function skyIconButton(extra?: string): string {
  return buttonClassName({ variant: 'secondary', className: clsx('size-10 px-0 [@media(pointer:coarse)]:size-11', extra) });
}
