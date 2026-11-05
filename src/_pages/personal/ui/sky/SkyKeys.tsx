'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { CircleHelp } from 'lucide-react';
import { SKY_UI } from '../../config/content';
import { skyIconButton } from './sky-buttons';
import styles from './sky.module.css';

const POPOVER_ID = 'sky-keys-pop';

/**
 * "?": the keys of the sky in a popover anchored at the button (FINAL-DESIGN §4.2.1). The native popover gives light
 * dismiss, Esc and focus return; it grows from the button (150 ms, opacity only under reduced motion).
 */
export function SkyKeys() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Place the popover above the button, right-aligned to it and inside the window, before it shows.
  useEffect(() => {
    const pop = popRef.current;
    if (!pop) return;
    const place = (e: Event) => {
      if ((e as ToggleEvent).newState !== 'open') return;
      const button = buttonRef.current;
      if (!button) return;
      const r = button.getBoundingClientRect();
      const w = Math.min(320, window.innerWidth - 32);
      const left = Math.min(Math.max(r.right - w, 16), window.innerWidth - w - 16);
      const below = r.top < 260;
      pop.style.left = `${left}px`;
      pop.style.width = `${w}px`;
      pop.style.top = below ? `${r.bottom + 8}px` : 'auto';
      pop.style.bottom = below ? 'auto' : `${window.innerHeight - r.top + 8}px`;
      pop.style.transformOrigin = `${r.left + r.width / 2 - left}px ${below ? '0' : '100%'}`;
    };
    pop.addEventListener('beforetoggle', place);
    return () => pop.removeEventListener('beforetoggle', place);
  }, []);

  return (
    <>
      <button ref={buttonRef} type="button" popoverTarget={POPOVER_ID} aria-label={SKY_UI.keysButton} className={skyIconButton()}>
        <CircleHelp aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
      </button>
      <div
        ref={popRef}
        id={POPOVER_ID}
        popover="auto"
        role="dialog"
        aria-labelledby={`${POPOVER_ID}-h`}
        className={clsx(
          'glass-chrome glass-tile glass-steel fixed inset-auto m-0 rounded-panel px-4 py-3.5 text-ink',
          styles.popover,
        )}
      >
        <h3 id={`${POPOVER_ID}-h`} className="m-0 mb-2 font-display text-ui font-semibold text-ink">
          {SKY_UI.keysTitle}
        </h3>
        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 font-body text-caption text-ink">
          {SKY_UI.keys.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-data text-caption">{k}</dt>
              <dd className="m-0">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
