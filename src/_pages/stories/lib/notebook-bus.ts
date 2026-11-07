import type { NotebookTarget } from './notebook-pages';

/*
 * The way other islands open a notebook page (NOTEBOOK-DESIGN §1.5): a `window` CustomEvent, so `JumpLink` (the atlas
 * card, the Journeys list) and the notebook controller never share a module of state.
 */

export const NOTEBOOK_OPEN_EVENT = 'aa:notebook-open';

export interface NotebookOpenDetail extends NotebookTarget {
  /** Scroll the book into view (a jump from elsewhere on the page). */
  readonly scroll: boolean;
}

/** True once the notebook controller is mounted and listening (its root carries `data-nb-live`). */
export function isNotebookLive(): boolean {
  return typeof document !== 'undefined' && document.querySelector('[data-nb-root][data-nb-live]') !== null;
}

/** Opens a page (and focuses its heading, or the alias entry's) through the controller. */
export function openNotebookPage(target: NotebookTarget, opts: { scroll?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  const detail: NotebookOpenDetail = { ...target, scroll: opts.scroll ?? true };
  window.dispatchEvent(new CustomEvent<NotebookOpenDetail>(NOTEBOOK_OPEN_EVENT, { detail }));
}
