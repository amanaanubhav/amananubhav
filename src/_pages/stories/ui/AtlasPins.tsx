'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { useEscapeKey } from '@/shared/lib/dom';
import { TrigPin } from '@/shared/ui/map';
import type { AtlasPinData } from '../lib/atlas-pins';
import { JumpLink } from './JumpLink';

const nf = new Intl.NumberFormat('en');

const cardId = (expeditionId: string) => `atlas-card-${expeditionId}`;

/** Card beside its pin: to the right of western pins, to the left of eastern ones; kept off the top and bottom edges. */
function cardPlacement(pin: AtlasPinData): CSSProperties {
  const x = pin.xPct > 55 ? 'calc(-100% - 22px)' : '22px';
  const y = pin.yPct > 70 ? 'calc(-100% + 16px)' : pin.yPct < 22 ? '-16px' : '-50%';
  return { left: `${pin.xPct}%`, top: `${pin.yPct}%`, transform: `translate(${x}, ${y})` };
}

/** Puts a TrigPin's label on the left of its triangle (TrigPin draws it at `left-full`). */
const LABEL_START = '[&>button>span]:left-auto [&>button>span]:right-full';

/** Below 768 px: the pin as a plain survey mark (no control, no label), same shape language as TrigPin. */
function PinMark({ pin }: { pin: AtlasPinData }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute flex size-3 -translate-x-1/2 -translate-y-1/2 text-ink md:hidden"
      style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
    >
      <svg viewBox="0 0 16 16" className="size-3 overflow-visible">
        <path
          d="M8 1.6 14.6 13.4H1.4Z"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={`signal-mark stroke-current ${pin.status === 'done' ? 'fill-current' : 'fill-ground'}`}
        />
      </svg>
    </span>
  );
}

const LINK_CLASSES =
  'inline-flex min-h-6 items-center rounded-control font-body text-ui text-ink underline decoration-signal decoration-1 ' +
  'underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2 ' +
  'focus-visible:[outline-style:solid] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-signal ' +
  '[@media(pointer:coarse)]:min-h-11';

/**
 * The atlas pin layer (§G.4): one `TrigPin` per expedition, in reading order west to east. A pin opens
 * a small caption card (`aria-expanded` / `aria-controls`); one card is open at a time; Escape or a
 * second press closes it and focus stays on, or returns to, its pin. Rendered as `ContourSheet`
 * children, so every position is a percentage of the sheet's viewBox.
 */
export function AtlasPins({ pins }: { pins: readonly AtlasPinData[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  const pinButton = (id: string) =>
    layerRef.current?.querySelector<HTMLButtonElement>(`button[aria-controls="${cardId(id)}"]`);

  useEscapeKey(() => {
    if (!openId) return;
    const active = document.activeElement;
    const card = document.getElementById(cardId(openId));
    const focusInside = !active || active === document.body || (card?.contains(active) ?? false);
    const pin = pinButton(openId);
    setOpenId(null);
    if (focusInside || active === pin) pin?.focus();
  }, openId !== null);

  return (
    <div ref={layerRef} className="absolute inset-0">
      {pins.map((pin) => {
        const open = openId === pin.expeditionId;
        const planned = pin.status === 'upcoming';
        return (
          // `contents` keeps the pin positioned in the overlay box. Below 768 px the whole sheet is shown, too
          // small for separate touch targets (the Himachal and Garhwal pins sit a few pixels apart), so the pins
          // become plain marks and the Journeys list above the sheet is the way in; nothing hidden is focusable.
          <div key={pin.expeditionId} className="contents">
            <PinMark pin={pin} />
            <div className={pin.labelStart ? `contents max-md:hidden ${LABEL_START}` : 'contents max-md:hidden'}>
              <TrigPin
                xPct={pin.xPct}
                yPct={pin.yPct}
                label={pin.label}
                altitudeM={pin.altitudeM}
                approx={pin.approx}
                status={pin.status}
                expanded={open}
                controls={cardId(pin.expeditionId)}
                onToggle={() => setOpenId(open ? null : pin.expeditionId)}
              />
              <div
                id={cardId(pin.expeditionId)}
                role="group"
                aria-label={`${pin.label}, caption`}
                hidden={!open}
                className="absolute z-10 w-56 rounded-panel border border-line bg-surface p-4 shadow-float"
                style={cardPlacement(pin)}
              >
                <p className="m-0 font-display text-ui font-semibold text-ink">{pin.label}</p>
                <p className="m-0 mt-1 font-body text-caption text-ink-muted">
                  {typeof pin.altitudeM === 'number' ? (
                    <>
                      <span className="font-data text-ink tabular">
                        {pin.approx ? (
                          <>
                            <span aria-hidden="true">~</span>
                            <span className="sr-only">about </span>
                          </>
                        ) : null}
                        {nf.format(pin.altitudeM)}
                      </span>{' '}
                      m, {pin.highPointName}
                    </>
                  ) : (
                    pin.highPointName
                  )}
                  {planned ? ' (planned)' : ''}
                </p>
                <p className="m-0 mt-3">
                  <JumpLink targetId={pin.sectionId} className={LINK_CLASSES} onJump={() => setOpenId(null)}>
                    Go to field note
                  </JumpLink>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
