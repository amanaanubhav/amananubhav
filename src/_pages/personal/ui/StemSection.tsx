import type { ComponentType, ReactNode } from 'react';
import { ChapterHeader } from '@/shared/ui/chapter-header';
import { Log, PlateFrame, Spread } from '@/shared/ui/journal';
import { MediaSlot } from '@/shared/ui/media-slot';
import { EARLY_BUILDS, STEM_INTRO, type EarlyBuild, type EarlyBuildId } from '../config/content';
import { BlinkComparator, PavanaPlate, RakshakPlate, SchrodingerPlate, VyomagamiPlate } from './plates';

type PlateComponent = ComponentType<{ className?: string }>;

/** G-06 diagrams by build (§F). The blink comparator is interactive and carries its own caption and buttons. */
const DIAGRAMS: Record<Exclude<EarlyBuildId, 'asteroids'>, PlateComponent> = {
  schrodinger: SchrodingerPlate,
  pavana: PavanaPlate,
  vyomagami: VyomagamiPlate,
  rakshak: RakshakPlate,
};

function BuildPlate({ build }: { build: EarlyBuild }): ReactNode {
  if (build.id === 'asteroids') {
    // Press-to-play only (§G.2): never animates on its own.
    return <BlinkComparator className="w-full max-w-[360px]" />;
  }
  const Diagram = DIAGRAMS[build.id];
  return (
    <div className="flex max-w-[360px] flex-col gap-8">
      <PlateFrame ratio="3:2" ticks caption={build.plateCaption}>
        {/* Each plate draws itself once at 30% in view (its own DrawOnView). */}
        <Diagram className="absolute inset-0" />
      </PlateFrame>
      {build.photoSlot ? <MediaSlot id={build.photoSlot} ratio="3:2" /> : null}
    </div>
  );
}

/**
 * `#stem`: Early builds (§G.2, [S-LIFE-STEM]). Five rows in an ordered list, the plate always on the right:
 * log (year, tags), title, description, and a G-06 diagram that draws once at 30% in view.
 */
export function StemSection() {
  return (
    <section id="stem" aria-labelledby="stem-title" className="pt-32 lg:pt-48">
      <Spread
        as="div"
        plateSpan="none"
        heading={
          <ChapterHeader as="h2" id="stem-title">
            {STEM_INTRO.title}
          </ChapterHeader>
        }
      >
        <p className="m-0 max-w-measure font-body text-lead text-ink [text-wrap:pretty]">{STEM_INTRO.lead}</p>
      </Spread>

      <ol className="m-0 mt-24 flex list-none flex-col gap-24 p-0 lg:mt-32 lg:gap-32">
        {EARLY_BUILDS.map((build) => (
          <Spread
            key={build.id}
            as="li"
            heading={
              <ChapterHeader as="h3" size="title">
                {build.title}
              </ChapterHeader>
            }
            log={
              <Log
                label={`${build.title} log`}
                items={[
                  { key: 'year', value: build.year },
                  { key: 'tags', value: build.tags.join(', '), mono: false },
                ]}
              />
            }
            plate={<BuildPlate build={build} />}
          >
            <p className="m-0 max-w-measure font-body text-body text-ink [text-wrap:pretty]">{build.desc}</p>
          </Spread>
        ))}
      </ol>
    </section>
  );
}
