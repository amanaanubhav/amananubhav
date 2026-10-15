import { SectionDotNav } from '@/shared/ui/section-dot-nav';

import { PERSONAL_SECTIONS } from '../config/sections';
import { AboutSection } from './AboutSection';
import { AthleticsSection } from './AthleticsSection';
import { BusinessSection } from './BusinessSection';
import { GallerySection } from './GallerySection';
import { StemSection } from './StemSection';

/** Life page. Server Component; the shell owns <main>, the `.dark` wrapper drives the dark: variants. */
export function PersonalPage() {
  return (
    <div className="relative z-10 min-h-screen bg-white text-black dark:bg-black dark:text-white">
      <SectionDotNav sections={PERSONAL_SECTIONS} />
      <div id="about">
        <AboutSection />
      </div>
      <div id="stem">
        <StemSection />
      </div>
      <div id="athletics">
        <AthleticsSection />
      </div>
      <div id="business">
        <BusinessSection />
      </div>
      <div id="gallery">
        <GallerySection />
      </div>
    </div>
  );
}
