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

const BASE =
  'group/button relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-display font-semibold ' +
  'transition-[filter,background-color,border-color,color,text-decoration-thickness,transform] duration-hover ease-settle ' +
  'focus-visible:[outline-style:solid] focus-visible:outline-2 ' +
  'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed';

const BOXED =
  'rounded-control px-5 active:scale-[0.98] active:duration-micro disabled:scale-100 aria-disabled:scale-100';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'btn-primary bg-signal text-on-signal hover:brightness-[1.06] [html[data-theme=day]_&]:hover:brightness-[0.94] ' +
    'focus-visible:outline-ink focus-visible:outline-offset-2 ' +
    'disabled:bg-surface-2 disabled:text-ink-muted disabled:filter-none aria-disabled:bg-surface-2 aria-disabled:text-ink-muted aria-disabled:filter-none',
  secondary:
    'border border-line-strong bg-transparent text-ink hover:bg-surface-2 ' +
    'focus-visible:outline-signal focus-visible:outline-offset-[3px] ' +
    'aria-[pressed=true]:border-ink aria-[pressed=true]:bg-surface-2 aria-[pressed=true]:shadow-[inset_0_-2px_0_rgb(var(--c-signal))] ' +
    'aria-[expanded=true]:border-ink aria-[expanded=true]:bg-surface-2 ' +
    'disabled:border-line disabled:text-ink-muted disabled:hover:bg-transparent aria-disabled:border-line aria-disabled:text-ink-muted',
  text:
    'min-h-6 rounded-control px-0 text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] hover:decoration-2 ' +
    'focus-visible:outline-signal focus-visible:outline-offset-[3px] [@media(pointer:coarse)]:min-h-11 ' +
    'disabled:text-ink-muted disabled:no-underline aria-disabled:text-ink-muted aria-disabled:no-underline',
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
  return `text-ui ${cn(BASE, variant === 'text' ? null : [BOXED, SIZES[size]], VARIANTS[variant], className)}`;
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
