import type { Metadata } from 'next';
import { House } from 'lucide-react';
import { ROUTES } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log } from '@/shared/ui/journal';
import { MARK_HEIGHT, RIDGE_OFFSET_Y, RIDGE_START, RidgeMark } from '@/shared/ui/ridge-mark';

/**
 * Own title, and robots set explicitly: otherwise the 404 inherits the home title and rootMetadata's
 * "index, follow", which contradicts the noindex Next.js injects for 404 responses.
 */
export const metadata: Metadata = {
  title: 'Off the trail | Aman Anubhav',
  robots: { index: false, follow: false },
};

/** End point of the trail in the 400 × 300 drawing: the foot of the signature ridge, which stands on it. */
const END = { x: 318, y: 82 } as const;
/** The mark's height in drawing units (it is twice as wide). */
const MARK = 40;
const MARK_SCALE = MARK / MARK_HEIGHT;
/** Where the mark's box goes so that its ridge starts exactly at the trail's end. */
const MARK_AT = {
  x: END.x - RIDGE_START.x * MARK_SCALE,
  y: END.y - (RIDGE_START.y + RIDGE_OFFSET_Y) * MARK_SCALE,
} as const;

const TRAIL =
  'M24 276C58 262 70 238 98 236S150 252 172 232 182 186 214 178 262 190 280 166 286 112 ' + `${END.x} ${END.y}`;

const CONTOURS = [
  'M0 214C64 196 112 214 168 198S268 150 330 156 400 134 400 134',
  'M0 158C52 140 104 160 150 142S236 96 296 104 400 82 400 82',
  'M0 104C46 90 96 104 136 88S214 46 268 52 400 30 400 30',
] as const;

/**
 * A dashed route in the signal line that ends at the foot of the signature ridge, with the trekker on its
 * summit, over three faint hand-drawn contours (§H.11). Decorative, no data; the page copy says everything.
 */
function TrailEndDrawing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true" focusable="false" className={className} fill="none">
      <g style={{ stroke: 'var(--ink-contour)', strokeWidth: 1 }}>
        {CONTOURS.map((d) => (
          <path key={d} d={d} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      <path
        d={TRAIL}
        className="route-line"
        vectorEffect="non-scaling-stroke"
        style={{
          stroke: 'rgb(var(--c-signal-line))',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          strokeDasharray: '6 5',
        }}
      />
      <circle cx={24} cy={276} r={4} className="fill-ground" style={{ stroke: 'rgb(var(--c-line-strong))', strokeWidth: 1.5 }} />
      <g transform={`translate(${MARK_AT.x} ${MARK_AT.y})`} className="text-ink">
        <RidgeMark size={MARK} lit />
      </g>
    </svg>
  );
}

/** 404 (§H.11, [S-UI-COPY]): "Off the trail." with a way back to base camp. Server component. */
export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="journal-grid min-h-[80svh] content-center gap-y-12 pb-24 pt-32 lg:pt-40"
    >
      <div className="col-[content-start/content-end] lg:col-[2/span_6] lg:row-start-1 lg:self-center">
        <ChapterHeader as="h1" id="not-found-title">
          Off the trail.
        </ChapterHeader>
        <Log items={[{ key: 'status', value: 404 }]} layout="strip" label="Status" className="mt-4" />
        <p className="m-0 mt-4 font-body text-lead text-ink">This page doesn&apos;t exist.</p>
        <div className="mt-8">
          <Button href={ROUTES.home} icon={House}>
            Back to base camp
          </Button>
        </div>
      </div>
      <div className="col-[content-start/content-end] lg:col-[8/span_5] lg:row-start-1 lg:self-center">
        <TrailEndDrawing className="block h-auto w-full max-w-md lg:max-w-none" />
      </div>
    </section>
  );
}
