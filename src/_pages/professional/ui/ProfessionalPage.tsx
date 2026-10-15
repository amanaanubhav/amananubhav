import { SectionDotNav } from '@/shared/ui/section-dot-nav';
import { PROFESSIONAL_SECTIONS } from '../config/sections';
import { ProfessionalHero } from './ProfessionalHero';
import { ExperienceSection } from './ExperienceSection';
import { TechStackSection } from './TechStackSection';
import { FeaturedProjectsSection } from './FeaturedProjectsSection';
import { AchievementsSection } from './AchievementsSection';

export function ProfessionalPage() {
  return (
    <div className="relative z-10 bg-white text-black dark:bg-black dark:text-white">
      <SectionDotNav sections={PROFESSIONAL_SECTIONS} />
      <div className="pt-20">
        <ProfessionalHero />
        <ExperienceSection />
        <TechStackSection />
        <FeaturedProjectsSection />
        <AchievementsSection />
      </div>
    </div>
  );
}
