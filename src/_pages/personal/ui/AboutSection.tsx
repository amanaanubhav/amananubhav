import { PROFILE } from '@/entities/profile';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, Spread } from '@/shared/ui/journal';
import type { LogEntry } from '@/shared/ui/journal';
import { StarChart } from '@/shared/ui/map';
import { MediaSlot } from '@/shared/ui/media-slot';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import { ORIGIN, ORIGIN_OPTIONAL_SLOTS } from '../config/content';
import { WINTER_SKY } from '../config/sky-charts.generated';

/** Component links: `link-ink` on a 1 px `link-underline`, 2 px on hover and focus (globals `.prose-link`). */
const LINK = 'prose-link inline-flex min-h-6 items-center rounded-control';

/**
 * The h1 as its two sentences, one per line block (P-05): the break falls between the sentences, never inside
 * one ("I didn't inherit talent. / I built it."). Balanced wrapping still works inside each sentence.
 */
function TitleSentences({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  return (
    <>
      {sentences.map((sentence) => (
        <span key={sentence} className="block">
          {sentence}
        </span>
      ))}
    </>
  );
}

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
      // The first section keeps its own top: the navbar band plus 40 px (phone) / 88 px (desktop), as before.
      className="pt-[calc(var(--nav-clear)+2.5rem)] lg:pt-[calc(var(--nav-clear)+5.5rem)]"
      // The display h1 takes cols 1-8 (it stops one gutter short of the portrait at track 10); the log moves to
      // row 2 beside the body (P-05).
      headingCols="lg:col-[2/span_8]"
      heading={
        <ChapterHeader as="h1" id="about-title">
          <TitleSentences text={ORIGIN.title} />
        </ChapterHeader>
      }
      log={<Log items={log} label="Origin log" />}
      plate={
        <div className="flex flex-col gap-16">
          {/*
            The inset straddles the portrait's lower-left corner (P-12): it sits in flow and is pulled up over the
            portrait by 176 px, so its real height (chart plus caption) sets the space below; nothing is reserved.
          */}
          <div className="mx-auto flex w-full max-w-[420px] flex-col lg:mx-0">
            <MediaSlot id="M-ORIGIN-01" ratio="4:5" caption="none" sizes="(min-width: 1024px) 420px, 100vw" priority />
            <div className="relative -mt-44 ml-3 w-[200px] md:-ml-6 [html:not([data-theme=day])_&_.plate]:shadow-[0_24px_56px_-24px_rgb(var(--c-aqua)/var(--alpha-glint))]">
              <MediaSlot
                id="M-ORIGIN-03"
                layout="inset"
                captionText={ORIGIN.insetCaption}
                fill={
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--sky-zenith)_0%_45%,var(--sky-horizon)_100%)] [html:not([data-theme=day])_&]:bg-aqua-soft [html:not([data-theme=day])_&]:bg-[linear-gradient(180deg,transparent_0%_45%,rgb(var(--c-aqua)/var(--alpha-spec))_100%)] [html:not([data-theme=day])_&]:outline [html:not([data-theme=day])_&]:outline-1 [html:not([data-theme=day])_&]:-outline-offset-1 [html:not([data-theme=day])_&]:outline-[rgb(var(--c-titanium-aqua)/var(--alpha-line))] [html:not([data-theme=day])_&]:[--ink-contour:rgb(var(--c-aqua)/var(--alpha-edge))]">
                    <StarChart
                      data={WINTER_SKY}
                      reveal="magnitude"
                      title={ORIGIN.insetTitle}
                      desc={ORIGIN.insetDesc}
                      className="h-full w-full [html:not([data-theme=day])_&]:[--c-ink:var(--c-accent-2)]"
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
