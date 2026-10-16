import { useId } from 'react';

import { LEDGER_GLYPH } from '../../config/copy';

const BLOCKS = [0, 1, 2] as const;
const SIZE = 56;
const GAP = 40;
const PAD = 2;
const WIDTH = PAD * 2 + SIZE * 3 + GAP * 2;
const HEIGHT = PAD * 2 + SIZE;

/**
 * G-21 ledger glyph: three linked squares labelled 1, 2 and 3 (no fake hashes). Each link is drawn from
 * the previous block's edge into the next one, so the chain reads left to right.
 */
export function LedgerGlyph({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const titleId = `ledger-${uid}-t`;
  const descId = `ledger-${uid}-d`;
  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={`${titleId} ${descId}`}
        className="block h-auto w-full max-w-[280px] text-ink"
      >
        <title id={titleId}>{LEDGER_GLYPH.title}</title>
        <desc id={descId}>{LEDGER_GLYPH.desc}</desc>
        {BLOCKS.map((i) => {
          const x = PAD + i * (SIZE + GAP);
          return (
            <g key={i}>
              <rect
                x={x}
                y={PAD}
                width={SIZE}
                height={SIZE}
                rx={2}
                strokeWidth={1.25}
                className="fill-surface stroke-current"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={x + SIZE / 2}
                y={PAD + SIZE / 2}
                dy="0.35em"
                textAnchor="middle"
                fontSize={18}
                className="fill-ink font-data tabular"
                aria-hidden="true"
              >
                {i + 1}
              </text>
              {i > 0 ? (
                <g aria-hidden="true">
                  <path
                    d={`M${x - GAP} ${PAD + SIZE / 2}H${x - 6}`}
                    fill="none"
                    strokeWidth={1.25}
                    className="stroke-line-strong"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path d={`M${x - 7} ${PAD + SIZE / 2 - 4}L${x} ${PAD + SIZE / 2}L${x - 7} ${PAD + SIZE / 2 + 4}Z`} className="fill-line-strong" />
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 font-body text-caption italic text-ink-muted">{LEDGER_GLYPH.caption}</figcaption>
    </figure>
  );
}
