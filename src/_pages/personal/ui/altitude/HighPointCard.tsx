'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getMotionTier } from '@/shared/lib/motion-tier';
import { heightText, type HighPoint } from '../../lib/high-points';

export interface HighPointCardProps {
  points: readonly HighPoint[];
  /** Server-rendered photos by point id (only `existing` registry slots). */
  photos: Readonly<Record<string, ReactNode>>;
  readJournal: string;
  solo: string;
  close: string;
}

type Mode = 'pop' | 'sheet';
interface OpenState {
  id: string;
  mode: Mode;
  style: CSSProperties;
}

const CARD_W = 260;
const CLOSE_GRACE_MS = 120;

/**
 * The card behind every High points mark (FINAL-DESIGN §4.5.1), and the marks' one-time rise. Server markup does the
 * rest: this island listens on its block (`[data-hp-block]`) for `[data-hp]` triggers.
 *
 * - Desktop labels: hover or focus opens a popover whose origin is the mark's apex. It stays while the pointer is on
 *   the label or the card (WCAG 1.4.13), Esc dismisses it. The label already is the journal link and its spoken
 *   text already carries every fact, so the popover is presentational (`aria-hidden`, its link out of tab order).
 * - Phone altimeter rows (`[data-hp-sheet]`): a tap opens the card as a bottom sheet (a non-modal dialog), focus goes
 *   to Close, and Esc, Close or a press outside returns focus to the row.
 * - The marks rise once at 30 % in view (scaleY 0.6 to 1 with opacity, 520 ms, 50 ms stagger, lowest first), only
 *   when the chart starts off screen and motion is allowed (OS reduced motion and lite devices keep it static).
 */
export function HighPointCard({ points, photos, readJournal, solo, close }: HighPointCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);
  const graceRef = useRef(0);
  const [open, setOpen] = useState<OpenState | null>(null);
  const [shown, setShown] = useState<OpenState | null>(null);

  const point = shown ? points.find((p) => p.id === shown.id) : undefined;

  const hide = useCallback((restoreFocus: boolean) => {
    window.clearTimeout(graceRef.current);
    setOpen(null);
    const back = returnRef.current;
    returnRef.current = null;
    if (restoreFocus && back) back.focus();
  }, []);

  const show = useCallback((trigger: HTMLElement, mode: Mode) => {
    window.clearTimeout(graceRef.current);
    const id = trigger.dataset.hp;
    const block = cardRef.current?.closest<HTMLElement>('[data-hp-block]');
    if (!id || !block) return;
    let style: CSSProperties = { transformOrigin: '50% 100%' };
    if (mode === 'pop') {
      const apex = block.querySelector<SVGGraphicsElement>(`[data-hp-apex="${CSS.escape(id)}"]`);
      const box = block.getBoundingClientRect();
      const mark = apex?.getBoundingClientRect();
      if (mark && mark.width > 0) {
        const ax = mark.left + mark.width / 2 - box.left;
        if (ax - CARD_W / 2 < 0) {
          // Near the left edge a card above the apex would be clamped over the height axis: set it beside the apex
          // instead, its top level with the mark, growing out of the apex (review UX P2-5).
          const left = ax + 14;
          const top = mark.top - box.top - 12;
          style = { left, top, transformOrigin: `-14px ${mark.height / 2 + 12}px` };
        } else {
          const left = Math.min(ax - CARD_W / 2, box.width - CARD_W);
          const lift = points.find((p) => p.id === id)?.highest ? 40 : 12;
          style = { left, bottom: box.bottom - mark.top + lift, transformOrigin: `${ax - left}px 100%` };
        }
      } else {
        const rect = trigger.getBoundingClientRect();
        style = { left: Math.max(0, rect.left - box.left), bottom: box.bottom - rect.top + 8 };
      }
    } else {
      returnRef.current = trigger;
    }
    const next = { id, mode, style };
    setOpen(next);
    setShown(next);
  }, [points]);

  // Focus moves to Close once the sheet is on screen.
  useEffect(() => {
    if (open?.mode === 'sheet') closeRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const card = cardRef.current;
    const block = card?.closest<HTMLElement>('[data-hp-block]');
    if (!card || !block) return;
    const triggerOf = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-hp]') : null;
    const inCard = (target: EventTarget | null) => target instanceof Node && card.contains(target);

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (inCard(event.target)) {
        window.clearTimeout(graceRef.current);
        return;
      }
      const trigger = triggerOf(event.target);
      if (trigger && !trigger.hasAttribute('data-hp-sheet')) show(trigger, 'pop');
    };
    const onOut = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (!triggerOf(event.target) && !inCard(event.target)) return;
      const to = event.relatedTarget;
      if (inCard(to) || (triggerOf(to) && triggerOf(to) === triggerOf(event.target))) return;
      window.clearTimeout(graceRef.current);
      graceRef.current = window.setTimeout(() => {
        setOpen((current) => (current?.mode === 'pop' ? null : current));
      }, CLOSE_GRACE_MS);
    };
    const onFocusIn = (event: FocusEvent) => {
      const trigger = triggerOf(event.target);
      if (trigger && !trigger.hasAttribute('data-hp-sheet') && trigger.matches(':focus-visible')) show(trigger, 'pop');
    };
    const onFocusOut = (event: FocusEvent) => {
      if (triggerOf(event.target) && !triggerOf(event.relatedTarget)) {
        setOpen((current) => (current?.mode === 'pop' ? null : current));
      }
    };
    const onClick = (event: MouseEvent) => {
      const trigger = triggerOf(event.target);
      if (!trigger || trigger.tagName !== 'BUTTON') return;
      show(trigger, trigger.hasAttribute('data-hp-sheet') ? 'sheet' : 'pop');
    };
    block.addEventListener('pointerover', onOver);
    block.addEventListener('pointerout', onOut);
    block.addEventListener('focusin', onFocusIn);
    block.addEventListener('focusout', onFocusOut);
    block.addEventListener('click', onClick);
    return () => {
      window.clearTimeout(graceRef.current);
      block.removeEventListener('pointerover', onOver);
      block.removeEventListener('pointerout', onOut);
      block.removeEventListener('focusin', onFocusIn);
      block.removeEventListener('focusout', onFocusOut);
      block.removeEventListener('click', onClick);
    };
  }, [show]);

  // Esc dismisses either form; a press outside the card (and its triggers) closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide(open.mode === 'sheet');
    };
    const onDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (cardRef.current?.contains(target) || target.closest('[data-hp]')) return;
      hide(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, hide]);

  // The marks rise once (lowest first) when the chart is first 30 % in view.
  useEffect(() => {
    const block = cardRef.current?.closest<HTMLElement>('[data-hp-block]');
    const chart = block?.querySelector<HTMLElement>('[data-hp-chart]');
    if (!chart || getMotionTier() === 0 || typeof IntersectionObserver === 'undefined') return;
    if (chart.getBoundingClientRect().top < window.innerHeight || chart.offsetParent === null) return;
    const marks = [...chart.querySelectorAll<SVGGElement>('[data-hp-mark]')];
    const anims = marks.map((g, i) =>
      g.animate(
        [
          { transform: 'scaleY(0.6)', opacity: 0 },
          { transform: 'scaleY(1)', opacity: 1 },
        ],
        { duration: 520, delay: i * 50, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' },
      ),
    );
    for (const anim of anims) anim.pause();
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        for (const anim of anims) anim.play();
      },
      { threshold: 0.3 },
    );
    io.observe(chart);
    return () => {
      io.disconnect();
      for (const anim of anims) anim.finish();
    };
  }, []);

  const isOpen = open !== null;
  const sheet = shown?.mode === 'sheet';
  const meta = point ? [point.when, point.region, point.solo ? solo : undefined].filter(Boolean).join(' · ') : '';

  return (
    <div
      ref={cardRef}
      role={sheet ? 'dialog' : undefined}
      aria-modal={sheet ? false : undefined}
      aria-labelledby={sheet ? 'hp-card-h' : undefined}
      aria-hidden={sheet ? undefined : true}
      data-open={isOpen ? '' : undefined}
      style={sheet ? { transformOrigin: '50% 100%' } : shown?.style}
      className={
        'glass-chrome glass-tile glass-steel grid gap-2 rounded-panel text-ink ' +
        (sheet
          ? 'fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)+8px)] z-chat-window p-[18px] '
          : 'absolute z-10 w-[260px] p-3.5 ') +
        // Out 100 ms, in 150 ms; scale only when motion is allowed (opacity alone under reduced motion).
        'invisible scale-[0.97] opacity-0 transition-[opacity,transform,visibility] duration-100 ease-depart ' +
        // Opening switches visibility at once (so Close can take focus); closing keeps it until the fade ends.
        'data-[open]:visible data-[open]:scale-100 data-[open]:opacity-100 data-[open]:duration-150 data-[open]:ease-settle ' +
        'data-[open]:[transition-property:opacity,transform] ' +
        'motion-reduce:scale-100'
      }
    >
      {point ? (
        <>
          <h4 id="hp-card-h" className="m-0 font-display text-ui font-semibold text-ink">
            {point.name}{' '}
            <span className="font-data font-normal [font-variant-numeric:tabular-nums]">{heightText(point)}</span>
          </h4>
          <p className="m-0 font-body text-caption text-ink-muted first-letter:uppercase">
            {/* "Summit · Triund" repeated the point's own name: the expedition shows only when it differs. */}
            {[point.kind, point.expedition !== point.name ? point.expedition : null].filter(Boolean).join(' · ')}
          </p>
          {meta ? <p className="m-0 font-body text-caption text-ink-muted">{meta}</p> : null}
          {photos[point.id] ? (
            <div className={`overflow-hidden rounded-[4px] ${sheet ? 'w-[min(100%,220px)]' : ''}`}>{photos[point.id]}</div>
          ) : null}
          {point.storyHref ? (
            <Link
              href={point.storyHref}
              tabIndex={sheet ? undefined : -1}
              className="prose-link inline-flex min-h-11 items-center self-start font-display text-[0.9375rem] font-semibold"
            >
              {readJournal}
            </Link>
          ) : null}
          {sheet ? (
            <button
              ref={closeRef}
              type="button"
              onClick={() => hide(true)}
              className={
                'satin-steel mt-1 inline-flex min-h-11 items-center justify-center rounded-control border px-4 ' +
                'font-display text-ui font-semibold text-ink transition-transform duration-micro active:scale-[0.97]'
              }
            >
              {close}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
