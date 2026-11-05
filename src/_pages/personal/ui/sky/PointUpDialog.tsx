'use client';

import { useEffect, useRef, type Ref } from 'react';
import { clsx } from 'clsx';
import { Smartphone } from 'lucide-react';
import { acquireScrollLock } from '@/shared/lib/smooth-scroll';
import { SKY_UI } from '../../config/content';
import type { Sky } from '../../lib/sky-engine';
import { prefersReducedMotion, setTouchAction } from './sky-dom';
import { skyButton } from './sky-buttons';
import styles from './sky.module.css';

export interface PointUpDialogProps {
  open: boolean;
  /** The live canvas (one canvas: it moves into the dialog and back to the plate). */
  canvas: HTMLCanvasElement;
  plate: HTMLElement;
  sky: Sky;
  /** Gestures for the inline plate when the dialog gives the canvas back. */
  inlineGestures: 'all' | 'horizontal';
  placeName: string;
  following: boolean;
  canOrient: boolean;
  /** "In the middle: Betelgeuse · 66° up · SE" (label may be empty). */
  middle: { label: string; body: string };
  note: string;
  /** The clock in the title bead, written by the engine. */
  timeRef: Ref<HTMLSpanElement>;
  onDone: () => void;
  onFollow: () => void;
}

const DRAWER = 'cubic-bezier(0.32, 0.72, 0, 1)';

/**
 * The full-screen sky (FINAL-DESIGN §4.2.3, fix S6): phones and tablets. Pointing and page scrolling cannot share one
 * screen, so this is a modal `<dialog>` (100dvh, `touch-action: none`) in which drag looks anywhere, pinch zooms and
 * a tap still selects; **Follow my phone** turns it into a pointing sky. It grows out of the plate's own rectangle
 * (300 ms drawer curve) and shrinks back into it (240 ms); a 150 ms cross-fade under reduced motion (sensor tracking
 * stays: it is the visitor's own movement). Done, Esc and the back gesture close it and return focus to the opener.
 */
export function PointUpDialog({
  open,
  canvas,
  plate,
  sky,
  inlineGestures,
  placeName,
  following,
  canOrient,
  middle,
  note,
  timeRef,
  onDone,
  onFollow,
}: PointUpDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const stage = stageRef.current;
    if (!dialog || !stage || !open) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const plateClip = () => {
      const r = plate.getBoundingClientRect();
      return `inset(${Math.max(0, r.top)}px ${Math.max(0, window.innerWidth - r.right)}px ${Math.max(0, window.innerHeight - r.bottom)}px ${Math.max(0, r.left)}px round 6px)`;
    };
    const from = plateClip();
    stage.append(canvas);
    setTouchAction(canvas, 'none');
    sky.setOptions({ gestures: 'all', wheel: 'always' });
    dialog.showModal();
    const release = acquireScrollLock();
    const reduced = prefersReducedMotion();
    const enter = reduced
      ? dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 })
      : dialog.animate([{ clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 300, easing: DRAWER });

    return () => {
      enter.cancel();
      const done = () => {
        if (dialog.open) dialog.close();
        plate.prepend(canvas);
        setTouchAction(canvas, inlineGestures === 'all' ? 'none' : 'pan-y');
        sky.setOptions({ gestures: inlineGestures, wheel: 'modifier' });
        release();
        const back = opener.current;
        (back && back.isConnected && !dialog.contains(back) ? back : canvas).focus({ preventScroll: true });
      };
      // Already gone (unmounted, or closed by the browser itself): restore at once, no exit animation.
      if (!dialog.isConnected || !dialog.open) {
        done();
        return;
      }
      const exit = prefersReducedMotion()
        ? dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: 'forwards' })
        : dialog.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: plateClip() }], {
            duration: 240,
            easing: DRAWER,
            fill: 'forwards',
          });
      exit.onfinish = () => {
        exit.cancel();
        done();
      };
    };
  }, [open, canvas, plate, sky, inlineGestures]);

  return (
    <dialog
      ref={dialogRef}
      data-palette-scope="night"
      data-lenis-prevent
      aria-labelledby="sky-full-h"
      onCancel={(e) => {
        e.preventDefault();
        onDone();
      }}
      // The browser can close a modal dialog without a cancelable cancel (a second Esc or Android back via the close
      // watcher): the state follows, so the canvas returns to the plate and "Look around" works again (review P2-4).
      onClose={() => {
        if (open) onDone();
      }}
      className={styles.full}
    >
      <div ref={stageRef} className="absolute inset-0" />
      <div aria-hidden="true" className={styles.reticle} />
      <div className="absolute inset-x-[max(12px,env(safe-area-inset-left))] top-[calc(env(safe-area-inset-top,0px)+12px)] z-[2] flex items-center justify-between gap-2">
        <button type="button" onClick={onDone} className={skyButton('secondary', 'h-12 [@media(pointer:coarse)]:h-12')}>
          {SKY_UI.full.done}
        </button>
        <p
          id="sky-full-h"
          className="glass-chrome glass-bead m-0 inline-flex h-12 items-center gap-2 rounded-full px-4 font-display text-[0.9375rem] font-semibold text-ink"
        >
          <span>
            {following ? SKY_UI.full.modePointing : SKY_UI.full.modeSky} · {placeName}
          </span>
          <span ref={timeRef} className="font-data font-medium tabular-nums" />
        </p>
      </div>
      <div className="absolute inset-x-[max(12px,env(safe-area-inset-left))] bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] z-[2] grid gap-2.5">
        <div className="glass-chrome glass-tile glass-steel rounded-panel px-4 py-3">
          <p aria-live="polite" className="m-0 font-body text-caption text-ink">
            {middle.label ? <b className="font-semibold">{middle.label} </b> : null}
            {middle.body}
          </p>
        </div>
        <p className="m-0 font-body text-caption text-ink-muted">{note}</p>
        {canOrient ? (
          <button
            type="button"
            aria-pressed={following}
            onClick={onFollow}
            className={clsx(skyButton('secondary', 'justify-self-start'))}
          >
            <Smartphone aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
            <span>{SKY_UI.full.follow}</span>
          </button>
        ) : null}
      </div>
    </dialog>
  );
}
