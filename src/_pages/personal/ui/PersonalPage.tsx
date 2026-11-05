import { SectionDotNav } from '@/shared/ui/section-dot-nav';
import { PERSONAL_SECTIONS } from '../config/sections';
import { AboutSection } from './AboutSection';
import { AthleticsSection } from './AthleticsSection';
import { BusinessSection } from './BusinessSection';
import { GallerySection } from './GallerySection';
import { NextSection } from './NextSection';
import { SkySection } from './sections/SkySection';
import { StemSection } from './StemSection';

/**
 * The Life page (FINAL-DESIGN §8, BUILD-PLAN §3.6). Server Component: the shell owns `<main>`; every section carries
 * its own id and `aria-labelledby`. Order: Origin, Night sky, Early builds, Ventures, Altitude, Field album, then the
 * next entry. The page's one h1 is the `#about` heading. Sections own no outer padding: the stack spaces them with
 * `gap-section`, and each heading carries its own scroll margin. The R3F stage does not run here (no `StageSlot`): the
 * live sky is a lazy 2D canvas island inside `SkySection`.
 */
export function PersonalPage() {
  return (
    <>
      {/* The route rail / dock is fixed chrome: outside the stack, so it never takes a gap. */}
      <SectionDotNav sections={PERSONAL_SECTIONS} variant="route" label="On this page" />
      <div className="relative flex flex-col gap-section">
        <AboutSection />
        <SkySection />
        <StemSection />
        <BusinessSection />
        <AthleticsSection />
        <GallerySection />
        <NextSection />
      </div>
    </>
  );
}
