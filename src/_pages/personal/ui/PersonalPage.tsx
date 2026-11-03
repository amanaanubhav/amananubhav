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
 * heading. Sections own no padding of their own (SYS-4, P-07): the stack spaces them with `gap-section`, so an
 * anchor jump lands the heading at `--nav-clear` (html scroll-padding), not 192 px under the navbar. The last
 * section has no bottom padding: the footer's `--space-seam` is the one seam (P-02); the phone dock's clearance
 * belongs to the dock (`--dock-h`), not to a page reserve.
 */
export function PersonalPage() {
  return (
    <>
      {/* The rail / dock is fixed chrome: outside the stack, so it never takes a gap. */}
      <SectionDotNav sections={PERSONAL_SECTIONS} />
      <div className="relative flex flex-col gap-section">
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
    </>
  );
}
