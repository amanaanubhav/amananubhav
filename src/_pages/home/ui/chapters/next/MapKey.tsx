import type { ReactElement } from 'react';

import { NEXT_COPY } from '../../../config/copy';
import styles from './next.module.css';

/**
 * The map key (NEXT-DESIGN §3.3, §3.4): solid = walked (the circuit), dashes = the planned leg from Muktinath, dots =
 * the expected trek, with the one honesty line. No mode of transport is named (the legs differ by line style only).
 * The samples are the map's own strokes (CSS px). No sources are listed.
 */
export function MapKey({ className }: { className?: string }): ReactElement {
  const k = NEXT_COPY.key;
  return (
    <div className={className}>
      <ul aria-label={k.label} className={`${styles.key} font-display text-caption font-medium text-ink`}>
        {/* Staged only: the static north sheet draws no walked line. */}
        <li className={styles.stagedOnly}>
          <svg viewBox="0 0 34 10" className={styles.sample} aria-hidden="true">
            <path d="M2 5H32" className={styles.casing} strokeWidth={4.5} strokeLinecap="round" />
            <path d="M2 5H32" className={styles.walked} strokeWidth={2.25} strokeLinecap="round" />
          </svg>
          {k.walked}
        </li>
        <li>
          <svg viewBox="0 0 34 10" className={styles.sample} aria-hidden="true">
            <path d="M1 5H33" className={styles.casing} strokeWidth={3.5} />
            <path d="M1 5H33" className={styles.jeep} strokeWidth={1.5} strokeDasharray="7 5" />
          </svg>
          {k.jeep}
        </li>
        <li>
          <svg viewBox="0 0 34 10" className={styles.sample} aria-hidden="true">
            <path d="M3 5H33" className={styles.casing} strokeWidth={5.2} strokeLinecap="round" strokeDasharray="0 6.5" />
            <path d="M3 5H33" className={styles.foot} strokeWidth={3.2} strokeLinecap="round" strokeDasharray="0 6.5" />
          </svg>
          {k.foot}
        </li>
      </ul>
      <p className="m-0 mt-2 font-body text-caption italic text-ink">{k.note}</p>
    </div>
  );
}
