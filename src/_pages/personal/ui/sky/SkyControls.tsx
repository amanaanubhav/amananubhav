'use client';

import type { ChangeEvent, KeyboardEvent, Ref } from 'react';
import { clsx } from 'clsx';
import { Maximize2, Minus, Plus, Smartphone } from 'lucide-react';
import { SKY_UI } from '../../config/content';
import type { SkyPlaceId, SkyPlaceOption } from '../../lib/sky-place';
import { skyButton, skyIconButton } from './sky-buttons';
import { SkyKeys } from './SkyKeys';
import styles from './sky.module.css';

export interface SkyControlsProps {
  places: readonly SkyPlaceOption[];
  placeId: SkyPlaceId;
  onPlace: (id: SkyPlaceId) => void;
  /** The When row. */
  live: boolean;
  onLive: () => void;
  dusk: string;
  dawn: string;
  scrubRef: Ref<HTMLInputElement>;
  /** Phones: the time next to the When key ("now" while live). Written by the engine through this ref. */
  whenNowRef: Ref<HTMLSpanElement>;
  onScrub: (e: ChangeEvent<HTMLInputElement>) => void;
  onScrubKey: (e: KeyboardEvent<HTMLInputElement>) => void;
  onPreset: () => void;
  /** Daylight and live: "See tonight" (sunset + 1 h) sits beside the preset. */
  showTonight: boolean;
  onTonight: () => void;
  /** Show / View. */
  lines: boolean;
  names: boolean;
  onLines: () => void;
  onNames: () => void;
  onZoom: (factor: number) => void;
  onFaceSouth: () => void;
  /** Phones and tablets (coarse pointers): the full-screen sky leads the controls (P0-5). */
  coarse: boolean;
  /** Coarse pointer with an orientation sensor: "Point your phone up" first. */
  canOrient: boolean;
  onPointUp: () => void;
  onLookAround: () => void;
}

const KEY = 'font-body text-caption italic text-accent-2';
const ROW = 'flex min-h-14 flex-wrap items-center gap-x-3 gap-y-2 border-t border-line py-2 first:border-t-0';

/**
 * The control strip under the plate (FINAL-DESIGN §4.2.1): solid `surface-2` with a steel rim, not glass, in one fixed
 * order (Where, When, Show, View), each row opening with its key in Literata italic. On phones the place moves to the
 * glass pill on the plate, and the full-screen sky leads (P0-5).
 */
export function SkyControls({
  places,
  placeId,
  onPlace,
  live,
  onLive,
  dusk,
  dawn,
  scrubRef,
  whenNowRef,
  onScrub,
  onScrubKey,
  onPreset,
  showTonight,
  onTonight,
  lines,
  names,
  onLines,
  onNames,
  onZoom,
  onFaceSouth,
  coarse,
  canOrient,
  onPointUp,
  onLookAround,
}: SkyControlsProps) {
  return (
    <div
      role="group"
      aria-label={SKY_UI.controlsLabel}
      className="grid border-y bg-surface-2 px-4 py-1 panel-steel md:rounded-panel md:border"
    >
      {coarse ? (
        <div className={clsx(ROW, 'grid')}>
          {canOrient ? (
            <>
              <button type="button" onClick={onPointUp} className={skyButton('primary', 'h-12 w-full [@media(pointer:coarse)]:h-12')}>
                <Smartphone aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
                <span>{SKY_UI.pointUp}</span>
              </button>
              <p className="-mt-0.5 mb-0 font-body text-caption text-ink-muted">{SKY_UI.pointUpCaption}</p>
            </>
          ) : null}
          <button
            type="button"
            onClick={onLookAround}
            className={skyButton(canOrient ? 'secondary' : 'primary', 'h-12 w-full [@media(pointer:coarse)]:h-12')}
          >
            <Maximize2 aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
            <span>{SKY_UI.lookAround}</span>
          </button>
        </div>
      ) : null}

      <div className={clsx(ROW, 'max-md:hidden')}>
        <span id="sky-where-k" className={clsx(KEY, 'w-14 shrink-0')}>
          {SKY_UI.where}
        </span>
        <fieldset aria-labelledby="sky-where-k" className="m-0 flex min-w-0 flex-wrap gap-1 border-0 p-0">
          {places.map((p) => (
            <label key={p.id} className="relative inline-flex">
              <input
                type="radio"
                name="sky-place"
                value={p.id}
                checked={p.id === placeId}
                onChange={() => onPlace(p.id)}
                className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
              />
              <span className="inline-flex min-h-10 items-center rounded-control border border-line px-3 font-display text-[0.9375rem] font-semibold leading-none text-ink-muted transition-[background-color,color,transform] duration-micro active:scale-[0.97] peer-checked:border-line-strong peer-checked:bg-action-soft peer-checked:text-ink peer-checked:shadow-[inset_0_-2px_0_var(--action-line)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring-action hover:bg-[var(--hover-wash)] hover:text-ink motion-reduce:active:scale-100 [@media(pointer:coarse)]:min-h-11">
                {p.segment}
              </span>
            </label>
          ))}
          <label className="relative inline-flex">
            <input
              type="radio"
              name="sky-place"
              value="you"
              checked={placeId === 'you'}
              onChange={() => onPlace('you')}
              className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
            />
            <span className="inline-flex min-h-10 items-center rounded-control border border-line px-3 font-display text-[0.9375rem] font-semibold leading-none text-ink-muted transition-[background-color,color,transform] duration-micro active:scale-[0.97] peer-checked:border-line-strong peer-checked:bg-action-soft peer-checked:text-ink peer-checked:shadow-[inset_0_-2px_0_var(--action-line)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus-ring-action hover:bg-[var(--hover-wash)] hover:text-ink motion-reduce:active:scale-100 [@media(pointer:coarse)]:min-h-11">
              {SKY_UI.places.you.segment}
            </span>
          </label>
        </fieldset>
      </div>

      <div className={clsx(styles.when, 'border-t border-line first:border-t-0')}>
        <label htmlFor="sky-scrub" className={clsx(KEY, styles.key)}>
          {SKY_UI.when}
        </label>
        <span ref={whenNowRef} aria-hidden="true" className={clsx(styles.now, 'font-data text-ui font-medium tabular-nums text-aqua')}>
          {SKY_UI.whenNow}
        </span>
        <div className={styles.track}>
          <span className={clsx(styles.dusk, 'whitespace-nowrap font-data text-caption tabular-nums text-ink-muted')}>
            {SKY_UI.sunset}
            {dusk}
          </span>
          <input
            ref={scrubRef}
            id="sky-scrub"
            type="range"
            min={0}
            step={1}
            defaultValue={0}
            onChange={onScrub}
            onKeyDown={onScrubKey}
            className={styles.range}
          />
          <span className={clsx(styles.dawn, 'whitespace-nowrap font-data text-caption tabular-nums text-ink-muted')}>
            {SKY_UI.sunrise}
            {dawn}
          </span>
        </div>
        <button
          type="button"
          aria-pressed={live}
          // Live cannot be pressed off: while live it says so (pressed, unavailable); scrubbed, a press returns to now.
          aria-disabled={live || undefined}
          onClick={onLive}
          className={clsx(skyButton('secondary', 'gap-2 pl-3 pr-3.5 aria-disabled:cursor-default'), styles.live)}
        >
          <span
            aria-hidden="true"
            className={clsx('size-2 shrink-0 rounded-full', live ? 'live-halo bg-live' : 'bg-steel')}
          />
          <span>{SKY_UI.live}</span>
        </button>
        <button
          type="button"
          onClick={onPreset}
          className={clsx(skyButton('secondary', 'h-auto min-h-10 justify-between gap-2.5 py-1.5 max-md:w-full [@media(pointer:coarse)]:h-auto [@media(pointer:coarse)]:min-h-11'), styles.preset)}
        >
          <span className="text-[0.875rem]">{SKY_UI.preset.title}</span>
          <span className="font-data text-caption font-normal tabular-nums text-ink-muted">{SKY_UI.preset.sub}</span>
        </button>
        {showTonight ? (
          <button
            type="button"
            onClick={onTonight}
            className={clsx(skyButton('secondary', 'h-auto min-h-10 justify-between gap-2.5 py-1.5 max-md:w-full [@media(pointer:coarse)]:h-auto [@media(pointer:coarse)]:min-h-11'), styles.tonight)}
          >
            <span className="text-[0.875rem]">{SKY_UI.tonight.title}</span>
            <span className="font-data text-caption font-normal tabular-nums text-ink-muted">{SKY_UI.tonight.sub}</span>
          </button>
        ) : null}
      </div>

      <div className={ROW}>
        <div className="flex items-center gap-1.5">
          <span className={clsx(KEY, 'mr-1')}>{SKY_UI.show}</span>
          <button type="button" aria-pressed={lines} onClick={onLines} className={skyButton()}>
            {SKY_UI.lines}
          </button>
          <button type="button" aria-pressed={names} onClick={onNames} className={skyButton()}>
            {SKY_UI.names}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={clsx(KEY, 'mr-1')}>{SKY_UI.view}</span>
          <button type="button" aria-label={SKY_UI.zoomOut} onClick={() => onZoom(1.4)} className={skyIconButton()}>
            <Minus aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
          </button>
          <button type="button" aria-label={SKY_UI.zoomIn} onClick={() => onZoom(1 / 1.4)} className={skyIconButton()}>
            <Plus aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
          </button>
          <button type="button" onClick={onFaceSouth} className={skyButton()}>
            {SKY_UI.faceSouth}
          </button>
          <SkyKeys />
        </div>
      </div>
    </div>
  );
}
