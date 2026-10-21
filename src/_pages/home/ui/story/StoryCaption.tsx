import type { CSSVars } from '@/shared/lib/css';

import styles from './story.module.css';

export interface StoryCaptionProps {
  head: string;
  text: string;
  /** Story anchor (s, vh) and slot height (vh). */
  at: number;
  slotVh: number;
}

/**
 * A one-line caption of the map-only stretch (the Manang days, §4 B6-B9): a short ink line over the
 * receded map, then the map comes fully forward again. No background.
 */
export function StoryCaption({ head, text, at, slotVh }: StoryCaptionProps) {
  return (
    <li className={styles.slot} style={{ '--slot-h': `${slotVh}vh` } as CSSVars}>
      <p data-story-at={at} data-recede="" className="text-body m-0 max-w-[34ch] py-8 font-body text-ink">
        <span className="mb-2 flex items-center gap-2 font-data text-caption font-semibold text-ink">
          <span aria-hidden="true" className={styles.tick} />
          {head}
        </span>
        {text}
      </p>
    </li>
  );
}
