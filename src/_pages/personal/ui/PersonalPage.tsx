import { SectionDotNav } from '@/shared/ui/section-dot-nav';
import { SKY_COPY } from '../config/content';
import { PERSONAL_SECTIONS } from '../config/sections';
import { AboutSection } from './AboutSection';
import { AthleticsSection } from './AthleticsSection';
import { BusinessSection } from './BusinessSection';
import { GallerySection } from './GallerySection';
import { SkyCopy, SkyPhotos, SkyPoster, skyHasConstellations, skyHighestText } from './sections/SkyParts';
import { SkySection } from './sections/SkySection';
import { StemSection } from './StemSection';

/**
 * The Life page (§G.2). Server Component: the shell owns `<main>`; every section carries its own id and
 * `aria-labelledby`. Order: about, stem, athletics, sky, business, gallery. The page's one h1 is the `#about`
 * heading. Below 1024 px the page keeps 72 px clear at the bottom for the section chip.
 */
export function PersonalPage() {
  return (
    <div className="relative pb-[72px] lg:pb-0">
      <SectionDotNav sections={PERSONAL_SECTIONS} />
      <AboutSection />
      <StemSection />
      <AthleticsSection />
      <SkySection
        copy={<SkyCopy />}
        poster={<SkyPoster />}
        photos={<SkyPhotos />}
        description={SKY_COPY.description}
        legend={SKY_COPY.legend}
        staticLegend={SKY_COPY.staticLegend}
        logLabel={SKY_COPY.logLabel}
        highest={skyHighestText()}
        hasConstellations={skyHasConstellations()}
      />
      <BusinessSection />
      <GallerySection />
    </div>
  );
}
