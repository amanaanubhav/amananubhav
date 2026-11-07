import { NEXT_COPY } from '../../config/copy';
import styles from '../story/story.module.css';

/** Caption C1's centre, vh below the slot's top: s 1817 when the scroll maps 1:1 from S_END. */
const CAPTION_VH = 101;

/**
 * The #next transition (docs/redesign/next-trek/NEXT-DESIGN.md §3.1, §5.2; build/CONTRACT.md §2): the story's last
 * slot, after `data-story-end`. Over it the map extends from Muktinath, where the walked circuit ends, and rides the
 * planned road past Kagbeni, Jomsom and Marpha, down the Kali Gandaki and up to Humkhola; caption C1 floats over the jeep leg like the story's captions (no
 * background; the map recedes under it). `data-next-anchor="marpha"` and `data-next-end` are read by the scroll map
 * (lib/story-scroll.ts). Staged layout only: under reduced motion, on lite devices and without the 3D map the slot
 * is not laid out and #next follows the story directly with its own static sheet. Its height (story.module.css
 * `.nextSlot`) makes the jeep leg scroll 1:1: S_END to the rest line is 320 vh of scroll for 320 vh of story.
 */
export function NextTransition() {
  const { head, text } = NEXT_COPY.caption;
  return (
    <div
      data-next-transition=""
      className={`${styles.nextSlot} motion-stage relative col-[content-start/content-end] lg:col-[2/span_5]`}
    >
      <p
        data-next-anchor="marpha"
        data-recede=""
        className="text-body absolute left-0 m-0 max-w-[34ch] -translate-y-1/2 py-8 font-body text-ink"
        style={{ top: `${CAPTION_VH}vh` }}
      >
        <span className="mb-2 flex items-center gap-2 font-data text-caption font-semibold text-ink">
          <span aria-hidden="true" className={styles.tick} />
          {head}
        </span>{' '}
        {text}
      </p>
      <div aria-hidden="true" data-next-end="" className="absolute bottom-0 left-0 h-0 w-full" />
    </div>
  );
}
