import Link from 'next/link';
import { getExpedition } from '@/entities/expedition';
import { STANDARD_COPY } from '../../config/content';

const KEY = 'font-body text-caption italic text-accent-2';
const WORD = 'm-0 font-display text-ui font-semibold leading-[1.5] text-ink';
const NUMBER = 'm-0 font-data text-[0.9375rem] font-medium leading-[1.6] text-ink [font-variant-numeric:tabular-nums]';

/**
 * The standard (FINAL-DESIGN §4.5): the Annapurna Circuit read from `entities/expedition`. It does not repeat 5,416 m
 * (the chart's Highest mark beside it says that), and the distance stays hidden until he picks a total.
 */
export function StandardPanel() {
  const exp = getExpedition('annapurna');
  const rows: { key: string; value: string; numeric: boolean }[] = [];
  if (exp.mode === 'solo' && exp.selfSupported) rows.push({ key: STANDARD_COPY.keys.how, value: STANDARD_COPY.how, numeric: false });
  if (exp.days !== undefined) rows.push({ key: STANDARD_COPY.keys.days, value: String(exp.days), numeric: true });
  // Q-B8: the pack.
  if (exp.packKg !== undefined) rows.push({ key: STANDARD_COPY.keys.pack, value: `${exp.packKg} kg`, numeric: true });
  if (exp.when) rows.push({ key: STANDARD_COPY.keys.when, value: exp.when, numeric: false });

  return (
    <aside aria-labelledby="std-h" className="panel-steel grid content-start gap-3.5 rounded-panel border bg-surface p-5">
      <h3 id="std-h" className="m-0 font-display text-title font-semibold text-ink">
        {exp.shortName}
      </h3>
      <dl className="m-0 grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2">
        {rows.map((row) => (
          <div key={row.key} className="contents">
            <dt className={KEY}>{row.key}</dt>
            <dd className={row.numeric ? NUMBER : WORD}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <Link
        href={STANDARD_COPY.link.href}
        className="prose-link inline-flex min-h-11 items-center justify-self-start font-display text-ui font-semibold"
      >
        {STANDARD_COPY.link.label}
      </Link>
    </aside>
  );
}
