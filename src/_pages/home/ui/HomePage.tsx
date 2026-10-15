import { SectionDotNav } from '@/shared/ui/section-dot-nav';

import { HOME_SECTIONS } from '../config/sections';
import { HeroSection } from './HeroSection';
import { Meander } from './meander/Meander';

/** Server Component: composes the client sections. The shell owns the single <main>. */
export function HomePage() {
  return (
    <div className="relative z-10 bg-white dark:bg-black">
      <SectionDotNav sections={HOME_SECTIONS} />
      <HeroSection />
      <div id="meander">
        <Meander />
      </div>
    </div>
  );
}
