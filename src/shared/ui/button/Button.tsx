import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { Spinner } from './Spinner';

/*
 * Server-safe on purpose (no 'use client'): a server page can render <Button icon={ArrowRight} href=...>
 * because the lucide component never crosses a client boundary; client components import it as usual.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'text';
export type ButtonSize = 'md' | 'lg';

interface ButtonBase {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  /** Sets `aria-busy` and shows a 270° arc spinner (static under reduced motion). */
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export type ButtonLinkProps = ButtonBase & { href: string; external?: boolean } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href' | 'children' | 'className'
  >;
export type ButtonActionProps = ButtonBase & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'className'
  >;
export type ButtonProps = ButtonLinkProps | ButtonActionProps;

/*
 * States follow the palette (PALETTE-SPEC §5.3, Update 1.1 §11 role remap): the focus ring is the global one (2 px
 * `focus-ring` = focus-ring-action 3 px off; `focus-ring-inverse` on the action fill, both from globals.css); surfaces
 * step by tone, never by a filter.
 * primary: the aquamarine action key. `.btn-primary` (globals.css) steps the fill to `action-hover` on hover (fine
 *   pointers) and to `action-pressed` with scale(0.98) while pressed, with a metal gloss; on-action >= 7.22:1 on all three.
 * secondary: `.satin-steel` (globals.css), a `surface-2` satin plate on a steel rim with a glass top edge; hover
 *   `surface-3` with a brushed (Night) / titanium (Day) rim; pressed and open (aria-expanded) `surface-3`; toggled
 *   (aria-pressed) `action-soft` with the 2 px action-line rule. Error-toned callers (text-error) keep their own edge.
 * text: ink with the 1 px action-line (link-underline) underline, 2 px in `action` on hover and focus.
 * disabled: the disabled-* roles (ink-muted text, line edge, surface-2 fill), never opacity alone.
 */
const BASE =
  'group/button relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-display font-semibold ' +
  'transition-[background-color,border-color,color,text-decoration-thickness,transform] duration-hover ease-settle ' +
  'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed';

const BOXED =
  'rounded-control px-5 active:scale-[0.98] active:duration-micro disabled:scale-100 aria-disabled:scale-100';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'btn-primary bg-action text-on-action ' +
    'disabled:bg-disabled-fill disabled:text-disabled-ink aria-disabled:bg-disabled-fill aria-disabled:text-disabled-ink',
  secondary:
    'border border-line-strong bg-surface-2 text-ink hover:border-ink-muted hover:bg-surface-3 active:bg-surface-3 ' +
    'aria-[pressed=true]:border-line-strong aria-[pressed=true]:bg-action-soft aria-[pressed=true]:shadow-[inset_0_-2px_0_var(--action-line)] ' +
    'aria-[expanded=true]:border-line-strong aria-[expanded=true]:bg-surface-3 ' +
    'disabled:border-disabled-edge disabled:bg-disabled-fill disabled:text-disabled-ink disabled:hover:border-disabled-edge disabled:hover:bg-disabled-fill disabled:active:bg-disabled-fill ' +
    'aria-disabled:border-disabled-edge aria-disabled:bg-disabled-fill aria-disabled:text-disabled-ink aria-disabled:hover:border-disabled-edge aria-disabled:hover:bg-disabled-fill',
  text:
    'min-h-6 rounded-control px-0 text-link-ink underline decoration-link-underline decoration-1 underline-offset-[0.22em] ' +
    'hover:decoration-2 hover:decoration-action focus-visible:decoration-2 focus-visible:decoration-action ' +
    // Coarse pointers get a 44 px tap box from a pseudo-element, so the link keeps its 24 px line in the layout.
    "[@media(pointer:coarse)]:before:absolute [@media(pointer:coarse)]:before:inset-x-0 [@media(pointer:coarse)]:before:-inset-y-2.5 [@media(pointer:coarse)]:before:content-[''] " +
    'disabled:text-disabled-ink disabled:no-underline aria-disabled:text-disabled-ink aria-disabled:no-underline',
};

const SIZES: Record<ButtonSize, string> = { md: 'h-11', lg: 'h-12' };

function isInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}): string {
  // text-ui stays outside cn(): tailwind-merge would read the custom type-scale class as a text color.
  const classes = cn(BASE, variant === 'text' ? null : [BOXED, SIZES[size]], VARIANTS[variant], className);
  // The satin steel material is the secondary at rest; an error-toned (destructive) secondary keeps its own edge and fill.
  const satin = variant === 'secondary' && !/(?:^|\s)text-error(?:\s|$)/.test(classes) ? ' satin-steel' : '';
  return `text-ui ${classes}${satin}`;
}

function Content({
  icon: Icon,
  iconPosition = 'start',
  loading,
  children,
}: Pick<ButtonBase, 'icon' | 'iconPosition' | 'loading' | 'children'>) {
  const iconNode = loading ? (
    <Spinner />
  ) : Icon ? (
    <Icon aria-hidden="true" focusable="false" className="size-[18px] shrink-0" strokeWidth={1.75} />
  ) : null;
  return (
    <>
      {iconPosition === 'start' ? iconNode : null}
      <span>{children}</span>
      {iconPosition === 'end' ? iconNode : null}
    </>
  );
}

/**
 * The site's one button (§D.3, §B.10). With `href` it renders a link (internal paths through next/link;
 * `external` opens a new tab and says so to screen readers); otherwise a `<button type="button">`.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const {
      href,
      external,
      variant,
      size,
      icon,
      iconPosition,
      loading,
      children,
      className,
      target,
      rel,
      ...anchorRest
    } = props;
    const classes = buttonClassName({ variant, size, className });
    const content = (
      <>
        <Content icon={icon} iconPosition={iconPosition} loading={loading}>
          {children}
        </Content>
        {external ? <VisuallyHidden> (opens in a new tab)</VisuallyHidden> : null}
      </>
    );
    const shared = {
      ...anchorRest,
      className: classes,
      'aria-busy': loading || undefined,
      target: external ? '_blank' : target,
      rel: external ? 'noopener noreferrer' : rel,
    };
    if (!external && isInternalHref(href)) {
      return (
        <Link href={href} {...shared}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} {...shared}>
        {content}
      </a>
    );
  }

  const { variant, size, icon, iconPosition, loading, children, className, type, ...buttonRest } = props;
  return (
    <button
      type={type ?? 'button'}
      {...buttonRest}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, className })}
    >
      <Content icon={icon} iconPosition={iconPosition} loading={loading}>
        {children}
      </Content>
    </button>
  );
}
