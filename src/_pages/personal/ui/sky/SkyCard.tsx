'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, X } from 'lucide-react';
import { SKY_UI } from '../../config/content';
import type { SkyInfo } from '../../lib/sky-engine';
import { skyButton, skyIconButton } from './sky-buttons';
import styles from './sky.module.css';

export interface SkyCardProps {
  info: SkyInfo | null;
  /** Phones: a compact two-line sheet docked at the bottom of the plate; More grows it to half the plate. */
  compact: boolean;
  onCentre: () => void;
  onClose: () => void;
}

/**
 * The selected card (FINAL-DESIGN §4.2.1, §4.2.2). Desktop: the first block of the side column (`surface` panel, not
 * glass: it sits beside the sky), with an empty state. Phones: a solid sheet on the plate, only while something is
 * selected. Kicker (Star / Planet / Moon / Constellation), name, sub-line and up to four facts, all written by the
 * engine. It enters in 180 ms (scale .97 + opacity, from the plate side); a fresh selection replays the entrance.
 */
export function SkyCard({ info, compact, onCentre, onClose }: SkyCardProps) {
  if (compact) return info ? <CompactCard key={info.id} info={info} onCentre={onCentre} onClose={onClose} /> : null;
  if (!info) {
    return (
      <div className="grid gap-3 rounded-panel border bg-surface p-[18px] panel-steel">
        <p className="m-0 font-body text-caption text-accent-2">{SKY_UI.card.selected}</p>
        <p className="m-0 font-body text-caption text-ink-muted">{SKY_UI.card.empty}</p>
      </div>
    );
  }
  return (
    <div key={info.id} className={clsx('grid origin-left gap-3 rounded-panel border bg-surface p-[18px] pb-4 panel-steel', styles.cardIn)}>
      <div className="grid gap-0.5">
        {info.kind !== info.title ? <p className="m-0 font-body text-caption text-accent-2">{info.kind}</p> : null}
        <h3 className="m-0 font-display text-title font-bold text-ink">{info.title}</h3>
        {info.kicker ? <p className="m-0 font-body text-caption text-ink-muted">{info.kicker}</p> : null}
      </div>
      <Facts info={info} />
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCentre} className={skyButton()}>
          {SKY_UI.card.centre}
        </button>
        <button type="button" onClick={onClose} aria-label={SKY_UI.card.close} className={clsx(skyIconButton(), 'ml-auto')}>
          <X aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function Facts({ info }: { info: SkyInfo }) {
  return (
    <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1.5">
      {info.lines.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-body text-caption italic text-accent-2">{k}</dt>
          <dd className="m-0 font-data text-caption tabular-nums text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function CompactCard({ info, onCentre, onClose }: { info: SkyInfo; onCentre: () => void; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const first = info.lines[0]?.[1] ?? '';
  return (
    <div
      data-lenis-prevent
      className={clsx(
        'absolute inset-x-2.5 bottom-2.5 z-[3] grid max-h-[50%] origin-bottom gap-2 overflow-auto overscroll-contain rounded-panel border bg-surface py-3 pl-3.5 pr-3 panel-steel',
        styles.cardIn,
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="m-0 font-display text-ui font-bold text-ink">{info.title}</h3>
        <span className="font-data text-caption tabular-nums text-ink-muted">{first}</span>
      </div>
      {expanded ? (
        <>
          {info.kicker ? <p className="m-0 font-body text-caption text-ink-muted">{info.kicker}</p> : null}
          <Facts info={info} />
        </>
      ) : null}
      <div className="flex items-center gap-2">
        {expanded ? (
          <button type="button" onClick={onCentre} className={skyButton()}>
            {SKY_UI.card.centre}
          </button>
        ) : null}
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)} className={skyButton()}>
          <span>{expanded ? SKY_UI.card.less : SKY_UI.card.more}</span>
          <ChevronUp aria-hidden="true" className={clsx('size-4 transition-transform duration-micro', expanded && 'rotate-180')} strokeWidth={1.75} />
        </button>
        <button type="button" onClick={onClose} aria-label={SKY_UI.card.close} className={clsx(skyIconButton(), 'ml-auto')}>
          <X aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
