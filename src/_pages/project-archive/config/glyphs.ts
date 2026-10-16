import {
  Activity,
  Atom,
  Fish,
  Gamepad2,
  GitBranch,
  Layers,
  Leaf,
  MapPin,
  Rocket,
  Route,
  ShieldCheck,
  SquareTerminal,
  Sun,
  Telescope,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import type { ProjectId } from '@/entities/project';

/**
 * G-15 project glyphs (§F): one lucide icon per build, keyed by the stable project id. Drawn at 24 px with a
 * 1.5 stroke and scaled ×2 into a 48 px box by the ledger, so every glyph shares one stroke and weight.
 * Named imports only (never the `icons` object), so the bundle carries just these sixteen.
 */
export const PROJECT_GLYPHS: Readonly<Record<ProjectId, LucideIcon>> = {
  divert: Route,
  travstory: MapPin,
  accolades: Layers,
  oceanbot: Fish,
  yvoo: ShieldCheck,
  kanad: Leaf,
  leetsync: GitBranch,
  site: SquareTerminal,
  'mario-rl': Gamepad2,
  lnn: Activity,
  pavana: Sun,
  rakshak: Waves,
  vyomagami: Rocket,
  schrodinger: Atom,
  asteroids: Telescope,
  sedu: Gamepad2,
};

/** The stroke the glyphs are drawn with, in 24-unit icon space (§F G-15). */
export const PROJECT_GLYPH_STROKE = 1.5;
