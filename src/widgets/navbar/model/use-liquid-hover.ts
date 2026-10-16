'use client';

import { animate, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type FocusEvent,
  type PointerEvent,
} from 'react';
import { MOTION } from '@/shared/config';
import { isKeyboardFocus } from '../lib/is-keyboard-focus';

/** Controls that the droplet visits carry this attribute. */
export const LIQUID_TARGET = 'data-liquid-target';

/** The droplet body is a 100 px strip scaled to length; the glint and caustic are fixed-size lights. */
export const BODY_PX = 100;
export const GLINT_PX = 30;
export const CAUSTIC_PX = 26;

/** The edge moving toward the target is quick; the trailing edge follows softly, so the drop stretches and settles. */
const LEAD = { type: 'spring', visualDuration: 0.22, bounce: 0.18 } as const;
const TRAIL = { type: 'spring', visualDuration: 0.44, bounce: 0.1 } as const;
/** Condensing in place on entry, evaporating on exit, the press squish and its springy release. */
const CONDENSE = { type: 'spring', visualDuration: 0.32, bounce: 0.35 } as const;
const FADE = { duration: MOTION.dur.hover, ease: MOTION.bezier.settle };
const SQUISH = { type: 'spring', visualDuration: 0.12, bounce: 0 } as const;
const RELEASE = { type: 'spring', visualDuration: 0.36, bounce: 0.45 } as const;

/** Extra length (px) at which the stretch flattens the drop the most, and by how much. */
const STRETCH_PX = 60;
const STRETCH_FLATTEN = 0.16;
/** A press spreads each end by 3 px and flattens the drop by 12%. */
const PRESS_SPREAD = 3;
const PRESS_FLATTEN = 0.12;
/** Light leaving the lens lands on the side opposite the glint, a little closer to the centre. */
const REFRACTION = 0.55;

const FINE_HOVER = '(hover: hover) and (pointer: fine)';
const subscribeFineHover = (onChange: () => void) => {
  const query = window.matchMedia(FINE_HOVER);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};
const getFineHover = () => window.matchMedia(FINE_HOVER).matches;
const getFineHoverServer = () => false;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export interface LiquidHoverValues {
  readonly left: MotionValue<number>;
  readonly capRight: MotionValue<number>;
  readonly bodyX: MotionValue<number>;
  readonly bodyScale: MotionValue<number>;
  readonly squash: MotionValue<number>;
  readonly fill: MotionValue<number>;
  readonly glow: MotionValue<number>;
  readonly glintX: MotionValue<number>;
  readonly causticX: MotionValue<number>;
}

/**
 * The navbar's liquid hover (owner's brief, Oct 2026): one glass drop that flows between the bar's controls.
 * Its two ends ride separate springs (the leading end quick, the trailing end soft), so it stretches toward the
 * target, flattens while stretched and settles round. A specular glint follows the pointer across its top and a
 * faint caustic answers on the opposite side of the bottom. Over the current link it merges into the bead.
 * Keyboard focus moves it too. Everything is motion values written from events (no React state per move),
 * rendered as transforms and opacity. Off for coarse pointers and reduced motion: the bar then uses a static wash.
 */
export function useLiquidHover(reduced: boolean, routeKey: string | null) {
  const fineHover = useSyncExternalStore(subscribeFineHover, getFineHover, getFineHoverServer);
  const active = fineHover && !reduced;

  const rawLeft = useMotionValue(0);
  const rawRight = useMotionValue(0);
  const rest = useMotionValue(0);
  const height = useMotionValue(34);
  const fill = useMotionValue(0);
  const glow = useMotionValue(0);
  const condense = useMotionValue(1);
  const press = useMotionValue(0);
  const pointerX = useMotionValue(0);

  const left = useTransform(() => rawLeft.get() - press.get() * PRESS_SPREAD);
  const right = useTransform(() =>
    Math.max(rawRight.get() + press.get() * PRESS_SPREAD, left.get() + height.get()),
  );
  const capRight = useTransform(() => right.get() - height.get());
  const bodyX = useTransform(() => left.get() + height.get() / 2);
  const bodyScale = useTransform(() => Math.max(0, right.get() - left.get() - height.get()) / BODY_PX);
  const squash = useTransform(() => {
    const over = Math.min(Math.max(0, right.get() - left.get() - rest.get()) / STRETCH_PX, 1);
    return (1 - over * STRETCH_FLATTEN) * (1 - press.get() * PRESS_FLATTEN) * condense.get();
  });
  const glintTarget = useTransform(() => {
    const radius = height.get() / 2;
    return clamp(pointerX.get(), left.get() + radius, right.get() - radius) - GLINT_PX / 2;
  });
  const glintX = useSpring(glintTarget, { stiffness: 420, damping: 34 });
  const causticX = useTransform(() => {
    const middle = (left.get() + right.get()) / 2;
    return middle - (glintX.get() + GLINT_PX / 2 - middle) * REFRACTION - CAUSTIC_PX / 2;
  });

  const dropRef = useRef<HTMLSpanElement>(null);
  const targetRef = useRef<HTMLElement | null>(null);
  const originRef = useRef(0);
  const hoveringRef = useRef(false);

  const flowTo = useCallback(
    (glass: HTMLElement, target: HTMLElement, clientX: number | null) => {
      const fresh = targetRef.current === null;
      targetRef.current = target;
      // Read once per new target, never per frame: the control's offset inside the glass and its inset.
      const inset = parseFloat(getComputedStyle(target).getPropertyValue('--inset-x')) || 0;
      const nextLeft = target.offsetLeft + inset;
      const nextRight = target.offsetLeft + target.offsetWidth - inset;
      originRef.current = glass.getBoundingClientRect().left + glass.clientLeft;
      const size = dropRef.current?.offsetHeight ?? height.get();
      height.set(size);
      rest.set(nextRight - nextLeft);
      const x = clientX === null ? (nextLeft + nextRight) / 2 : clientX - originRef.current;
      pointerX.set(x);

      if (fresh) {
        // Condense in place: no travel from wherever the drop last evaporated.
        rawLeft.jump(nextLeft);
        rawRight.jump(nextRight);
        // Derived values settle on the next frame, so the glint's start is computed here.
        glintX.jump(clamp(x, nextLeft + size / 2, nextRight - size / 2) - GLINT_PX / 2);
        condense.jump(0.82);
        animate(condense, 1, CONDENSE);
      } else {
        const toRight = nextLeft > rawLeft.get();
        animate(rawLeft, nextLeft, toRight ? TRAIL : LEAD);
        animate(rawRight, nextRight, toRight ? LEAD : TRAIL);
      }
      // Over the current link the drop merges into the bead; the glint stays on.
      animate(fill, target.hasAttribute('aria-current') ? 0 : 1, FADE);
      animate(glow, 1, FADE);
    },
    [condense, fill, glintX, glow, height, pointerX, rawLeft, rawRight, rest],
  );

  const evaporate = useCallback(() => {
    targetRef.current = null;
    animate(fill, 0, FADE);
    animate(glow, 0, FADE);
    animate(condense, 0.85, FADE);
    animate(press, 0, RELEASE);
  }, [condense, fill, glow, press]);

  // A click lands the bead on the hovered link: the drop merges into it.
  useEffect(() => {
    if (targetRef.current?.hasAttribute('aria-current')) animate(fill, 0, FADE);
  }, [routeKey, fill]);

  // Turning motion off mid-hover leaves no drop behind.
  useEffect(() => {
    if (!active) evaporate();
  }, [active, evaporate]);

  const targetOf = (element: EventTarget | null) =>
    element instanceof Element ? element.closest<HTMLElement>(`[${LIQUID_TARGET}]`) : null;

  const handlers = {
    onPointerOver(event: PointerEvent<HTMLElement>) {
      if (!active || event.pointerType !== 'mouse') return;
      hoveringRef.current = true;
      const target = targetOf(event.target);
      if (target && target !== targetRef.current) flowTo(event.currentTarget, target, event.clientX);
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      if (targetRef.current) pointerX.set(event.clientX - originRef.current);
    },
    onPointerLeave() {
      hoveringRef.current = false;
      if (targetRef.current) evaporate();
    },
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (targetRef.current && event.button === 0) animate(press, 1, SQUISH);
    },
    onPointerUp() {
      animate(press, 0, RELEASE);
    },
    onFocus(event: FocusEvent<HTMLElement>) {
      if (!active || !isKeyboardFocus(event.target)) return;
      const target = targetOf(event.target);
      if (target && target !== targetRef.current) flowTo(event.currentTarget, target, null);
    },
    onBlur(event: FocusEvent<HTMLElement>) {
      const stillInside = event.currentTarget.contains(event.relatedTarget as Node | null);
      if (!stillInside && !hoveringRef.current && targetRef.current) evaporate();
    },
    onPointerCancel() {
      animate(press, 0, RELEASE);
    },
  };

  const values: LiquidHoverValues = {
    left,
    capRight,
    bodyX,
    bodyScale,
    squash,
    fill,
    glow,
    glintX,
    causticX,
  };

  return { active, dropRef, handlers, values };
}
