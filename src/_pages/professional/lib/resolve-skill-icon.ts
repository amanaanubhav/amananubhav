import {
  Bot,
  Brain,
  Cloud,
  Code2,
  Database,
  Layers,
  Network,
  Terminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { SkillCategoryKey } from '@/entities/skill';

/** Case-sensitive substring heuristics, verbatim from the legacy TechStack mapping. */
export function resolveSkillIcon(category: SkillCategoryKey, name: string): LucideIcon {
  switch (category) {
    case 'ai_ml':
      return name.includes('Neural') || name.includes('RL') || name.includes('Q') ? Brain : Bot;
    case 'languages':
      return Code2;
    case 'full_stack':
      return name.includes('SQL') || name.includes('Mongo') || name.includes('Base') || name.includes('Redis')
        ? Database
        : Layers;
    case 'cloud_devops':
      return name.includes('Docker') ||
        name.includes('Kuber') ||
        name.includes('Cloud') ||
        name.includes('AWS') ||
        name.includes('GCP') ||
        name.includes('Azure')
        ? Cloud
        : Network;
    case 'tools':
      return name.includes('Git') ? Terminal : Wrench;
  }
}
