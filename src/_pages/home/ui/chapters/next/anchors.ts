import { S_NEXT_REST } from '../../scenes/story/next-timeline';

/**
 * The #next story anchor (docs/redesign/next-trek/build/CONTRACT.md §1), in story s (vh), for the home story driver:
 *
 *   [data-next-anchor="rest"]  the #next header; its top at `--rest-line` % of the viewport height -> s NEXT_S.rest
 *
 * The element carries its s as `data-next-at`. `--rest-line` is set on #next (unitless: 22 on desktop, 52 below
 * 1024 px, NEXT_MOBILE_MAX_WIDTH). The transition before it (s 1665 to 1985: the jeep leg and caption C1) is the story's own slot
 * (Meander's NextTransition, the scene step).
 */
export const NEXT_S = {
  rest: S_NEXT_REST,
} as const;
