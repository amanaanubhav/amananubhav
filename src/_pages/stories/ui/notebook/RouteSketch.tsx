import type { CSSProperties } from 'react';
import type { CSSVars } from '@/shared/lib/css';
import { labelOffset, SKETCH_H, SKETCH_W, type SketchGeometry, type SketchMark } from '../../lib/route-sketch';
import { NOTEBOOK_COPY } from '../../config/treks';
import styles from './notebook.module.css';

/** The site's trig triangle (AtlasPins `PinMark`), centred on 0,0 and 12 units wide. */
const TRIANGLE = 'M0 -5.4L6 5.4H-6Z';

/** A group placed at a sketch point and drawn at about its px size whatever the sketch's width (`--nb-ms`). */
function at(x: number, y: number): CSSProperties {
  return { transform: `translate(${x}px, ${y}px) scale(var(--nb-ms, 1))` };
}

function Mark({ mark }: { mark: SketchMark }) {
  const style: CSSVars = { '--nb-td': mark.td, '--nb-t': mark.t };
  const label = labelOffset(mark.side);
  return (
    <g className={styles.mark} style={style}>
      <g style={at(mark.x, mark.y)}>
        <path d={TRIANGLE} className={styles.tri} data-tone={mark.tone} />
        <text x={label.x} y={label.y} textAnchor={label.anchor} className={styles.num}>
          {mark.numbers.join(', ')}
        </text>
      </g>
    </g>
  );
}

/** A small N over a 10-unit arrow, top right, in steel. */
function North() {
  return (
    <g className={styles.north} style={at(SKETCH_W - 12, 22)}>
      <text x={0} y={-10} textAnchor="middle">
        {NOTEBOOK_COPY.north}
      </text>
      <path d="M0 9V-5M-3 -1.5 0 -5 3 -1.5" className={styles.northArrow} />
    </g>
  );
}

export interface RouteSketchProps {
  geometry: SketchGeometry;
  /** Unique per page (mask and text ids). */
  idPrefix: string;
  title: string;
  desc: string;
}

/**
 * The left page's route figure (NOTEBOOK-DESIGN §2.4), drawn on the server in a 300x200 box: the route in oxblood
 * (dashed for a plan from estimated positions, solid from a GPX track), numbered trig marks (names live in the stop
 * list, so labels never collide), a north arrow, and for a track a round scale bar. No grid, graticule or contours.
 * The line is revealed through a mask whose stroke draws on a turn (notebook.module.css); the visible line keeps its
 * own dashes. The stop list under it is the text equivalent.
 */
export function RouteSketch({ geometry, idPrefix, title, desc }: RouteSketchProps) {
  const titleId = `${idPrefix}-t`;
  const descId = `${idPrefix}-d`;
  const maskId = `${idPrefix}-m`;
  const { d, marks, scaleBar } = geometry;

  return (
    <svg
      viewBox={`0 0 ${SKETCH_W} ${SKETCH_H}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className={styles.sketch}
      focusable="false"
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{desc}</desc>
      {d ? (
        <>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={SKETCH_W} height={SKETCH_H} className={styles.drawMask}>
            <path d={d} pathLength={1} className={styles.drawPath} />
          </mask>
          <path d={d} mask={`url(#${maskId})`} className={styles.routeLine} data-kind={geometry.kind} />
        </>
      ) : null}
      {scaleBar ? (
        <g aria-hidden="true">
          <path
            d={`M12 ${SKETCH_H - 12}h${scaleBar.length}M12 ${SKETCH_H - 15}v6M${12 + scaleBar.length} ${SKETCH_H - 15}v6`}
            className={styles.scaleBar}
          />
          <g style={at(12, SKETCH_H - 18)}>
            <text x={0} y={0} className={styles.scaleLabel}>
              {scaleBar.label}
            </text>
          </g>
        </g>
      ) : null}
      <g aria-hidden="true">
        {marks.map((mark) => (
          <Mark key={mark.numbers.join('-')} mark={mark} />
        ))}
        <North />
      </g>
    </svg>
  );
}
