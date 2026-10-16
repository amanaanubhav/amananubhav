import { PROFILE } from '@/entities/profile';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { StarChart } from '@/shared/ui/map';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { ORIGIN, ORIGIN_OPTIONAL_SLOTS } from '../config/content';
import { WINTER_SKY } from '../config/sky-charts.generated';

const LINK =
  'inline-flex min-h-6 items-center rounded-control text-ink underline decoration-signal decoration-1 underline-offset-[0.22em] transition-[text-decoration-thickness] duration-hover hover:decoration-2';

/** The `elsewhere` log value: text links from `PROFILE.links` (no phone, ever). */
function Elsewhere() {
  const { linkedin, github, kaggle, instagram, email } = PROFILE.links;
  const links = [
    { label: 'LinkedIn', href: linkedin, external: true },
    { label: 'GitHub', href: github, external: true },
    { label: 'Kaggle', href: kaggle, external: true },
    { label: 'Instagram', href: instagram, external: true },
    { label: 'Email', href: `mailto:${email}`, external: false },
  ];
  return (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className={LINK}
          {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {link.label}
          {link.external ? <VisuallyHidden> (opens in a new tab)</VisuallyHidden> : null}
        </a>
      ))}
    </span>
  );
}

/**
 * `#about`: Origin (§G.2). The page's h1 is this spread's heading. Log column of measured facts, three
 * [S-CH1-ORIGIN] paragraphs, the portrait plate with the winter-sky inset over its lower-left corner.
 */
export function AboutSection() {
  const log: LogEntry[] = [
    { key: 'born in', value: ORIGIN.bornIn, mono: false },
    { key: 'latitude', value: ORIGIN.latitude },
    { key: 'now', value: ORIGIN.now, mono: false },
    { key: 'daily stack', value: PROFILE.dailyStack?.join(', ') },
    { key: 'focus', value: PROFILE.focus?.join(', '), mono: false },
    { key: 'elsewhere', value: <Elsewhere />, mono: false },
    { key: 'featured in', value: ORIGIN.featuredIn, href: PROFILE.links.news, external: true, mono: false },
  ];

  return (
    <Spread
      id="about"
      labelledBy="about-title"
      className="pt-28 lg:pt-40"
      heading={
        <ChapterHeader as="h1" id="about-title">
          {ORIGIN.title}
        </ChapterHeader>
      }
      log={<Log items={log} label="Origin log" />}
      plate={
        <div className="flex flex-col gap-16">
          {/* The inset straddles the portrait's lower-left corner by 24 px; pb reserves its overhang and caption. */}
          <div className="relative mx-auto w-full max-w-[420px] pb-28 lg:mx-0">
            <MediaSlot id="M-ORIGIN-01" ratio="4:5" caption="none" sizes="(min-width: 1024px) 420px, 100vw" />
            <div className="absolute left-3 top-[calc(100%-7rem-176px)] w-[200px] md:-left-6">
              <MediaSlot
                id="M-ORIGIN-03"
                layout="inset"
                captionText={ORIGIN.insetCaption}
                fill={
                  <div className="absolute inset-0 bg-sky">
                    <StarChart
                      data={WINTER_SKY}
                      reveal="magnitude"
                      title={ORIGIN.insetTitle}
                      desc={ORIGIN.insetDesc}
                      className="h-full w-full"
                    />
                  </div>
                }
              />
            </div>
          </div>
          <div className="grid gap-8 empty:hidden sm:grid-cols-2">
            {ORIGIN_OPTIONAL_SLOTS.map((id) => (
              <MediaSlot key={id} id={id} />
            ))}
          </div>
        </div>
      }
    >
      <div className="flex max-w-measure flex-col gap-4 font-body text-body text-ink [&>p]:[text-wrap:pretty]">
        {ORIGIN.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="m-0">
            {paragraph}
          </p>
        ))}
      </div>
    </Spread>
  );
}
