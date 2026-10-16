import type { ComponentType } from 'react';
import type { ProjectId } from '@/entities/project';
import { AccoladesIngestion } from './AccoladesIngestion';
import { DivertCorridor } from './DivertCorridor';
import { KanadPipeline } from './KanadPipeline';
import { OceanBotHead } from './OceanBotHead';
import type { BlueprintProps, SheetVariant } from './parts';
import { TravStoryPipeline } from './TravStoryPipeline';
import { YvooEnsemble } from './YvooEnsemble';

export { AgentLoop } from './AgentLoop';
export { AccoladesIngestion, DivertCorridor, KanadPipeline, OceanBotHead, TravStoryPipeline, YvooEnsemble };
export type { BlueprintProps, SheetVariant };

/** G-05b to G-05g, keyed by the stable project ids (§F). Projects without a diagram are absent. */
export const BLUEPRINTS: Readonly<Partial<Record<ProjectId, ComponentType<BlueprintProps>>>> = {
  travstory: TravStoryPipeline,
  divert: DivertCorridor,
  accolades: AccoladesIngestion,
  oceanbot: OceanBotHead,
  yvoo: YvooEnsemble,
  kanad: KanadPipeline,
};

/** Blueprints that run their own animation (and their own Play control) instead of the shared draw-on-view. */
export const SELF_ANIMATED: ReadonlySet<ProjectId> = new Set<ProjectId>(['divert']);
