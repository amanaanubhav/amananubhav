import { ACHIEVEMENTS } from '@/entities/achievement';
import { EXPERIENCE } from '@/entities/experience';
import { PROFILE } from '@/entities/profile';
import { PROJECTS, selectFeaturedProjects } from '@/entities/project';
import { SectionDotNav } from '@/shared/ui/section-dot-nav';
import { PROFESSIONAL_SECTIONS } from '../config/sections';
import { featuredHonors } from '../lib/select';
import { AchievementsSection } from './AchievementsSection';
import { ExperienceSection } from './ExperienceSection';
import { FeaturedProjectsSection } from './FeaturedProjectsSection';
import { ProfessionalHero } from './ProfessionalHero';
import { RemoteSection } from './RemoteSection';
import { TechStackSection } from './TechStackSection';

/** The featured six in featuredOrder, and the six starred honors, selected on the server. */
const FEATURED_PROJECTS = selectFeaturedProjects(PROJECTS, 6);
const FEATURED_HONORS = featuredHonors(ACHIEVEMENTS, 6);

/**
 * /professional (§G.3): the recruiter lane, readable in ten seconds. Role, proof, how I work remotely, stack,
 * projects, honors. No WebGL; a plain rail without altitudes. Server component; client islands are the vault
 * buttons, the hero plate's draw, the timeline spine, the overlap band, the blueprint draws and the DIVERT corridor.
 */
export function ProfessionalPage() {
  return (
    <div className="relative">
      <SectionDotNav sections={PROFESSIONAL_SECTIONS} />
      <ProfessionalHero />
      <ExperienceSection experience={EXPERIENCE} education={PROFILE.education} />
      <RemoteSection />
      <TechStackSection />
      <FeaturedProjectsSection projects={FEATURED_PROJECTS} />
      <AchievementsSection items={FEATURED_HONORS} />
    </div>
  );
}
