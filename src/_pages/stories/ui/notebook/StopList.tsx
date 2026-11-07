import type { CSSVars } from '@/shared/lib/css';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { NOTEBOOK_COPY } from '../../config/treks';
import styles from './notebook.module.css';

const nf = new Intl.NumberFormat('en');

export interface StopRow {
  /** The stop's number, the same as its mark on the sketch. */
  readonly number: number;
  readonly name: string;
  /** Only a confirmed or commonly cited figure from the entity, never one from a GPX (NB-7). */
  readonly altitudeM?: number;
  readonly approx?: boolean;
  /** A map figure has no mark for it. */
  readonly notPlaced?: boolean;
}

/** More stops than this scroll inside the page (a future trek), so the book keeps its height budget. */
const SCROLL_FROM = 11;

/**
 * The stops in walking order under the route figure (§2.4): number, name, the altitude when the entity holds a shown
 * one (with the hidden "about"), and "(not placed)" for a stop the map figure could not draw. More than four stops run
 * in two columns from 1280 px. One note under the list says the heights are approximate.
 */
export function StopList({ rows, label }: { rows: readonly StopRow[]; label: string }) {
  if (rows.length === 0) return null;
  const twoCols = rows.length > 4;
  const scrolls = rows.length >= SCROLL_FROM;
  const style: CSSVars = { '--nb-rows': Math.ceil(rows.length / 2) };
  const anyHeight = rows.some((row) => typeof row.altitudeM === 'number');

  return (
    <>
      <ol
        role="list"
        aria-label={label}
        className={styles.stops}
        data-cols={twoCols ? '2' : undefined}
        data-scroll={scrolls ? '' : undefined}
        tabIndex={scrolls ? 0 : undefined}
        style={twoCols ? style : undefined}
      >
        {rows.map((row) => (
          <li key={`${row.number}-${row.name}`} className={styles.stop}>
            <span aria-hidden="true" className="font-data text-caption text-ink-muted tabular">
              {row.number}
            </span>
            <span className="min-w-0 font-body text-ui text-ink">
              {row.name}
              {row.notPlaced ? (
                <span className="ml-[0.4em] font-body text-caption italic text-ink-muted">({NOTEBOOK_COPY.notPlaced})</span>
              ) : null}
            </span>
            {typeof row.altitudeM === 'number' ? (
              <span className="whitespace-nowrap font-data text-caption text-ink tabular">
                {row.approx ? <span aria-hidden="true">~</span> : null}
                {row.approx ? <VisuallyHidden>about </VisuallyHidden> : null}
                {nf.format(row.altitudeM)}
                <span className="ml-[0.2em] text-ink-muted">m</span>
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
      {anyHeight ? (
        <p className="m-0 mt-3 font-body text-caption italic text-ink-muted">{NOTEBOOK_COPY.heightsNote}</p>
      ) : null}
    </>
  );
}
