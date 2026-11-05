import { scrollToTarget } from '@/shared/lib/smooth-scroll';

/**
 * The in-page landing rule (BUILD-PLAN §2.3): glide to the target with `scrollToTarget` (Lenis when it runs, else a
 * native scroll that honours reduced motion) and move keyboard focus to the target's heading, so a keyboard or
 * screen-reader reader lands where they asked to go. A section focuses its h1/h2; an element with `data-focus`
 * focuses that id (`#sky-live` → `#sky-h`); anything else focuses itself. Returns false when the target is missing,
 * so the caller can let the browser follow the plain `#hash`.
 */
export function landOn(href: string): boolean {
  const id = href.startsWith('#') ? href.slice(1) : href;
  const el = id ? document.getElementById(id) : null;
  if (!el) return false;
  const focusId = el.dataset.focus;
  const target =
    (focusId ? document.getElementById(focusId) : null) ??
    (el.matches('section') ? el.querySelector<HTMLElement>('h1, h2') : null) ??
    el;
  scrollToTarget(el, { offset: clearOffset(el) });
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}

/**
 * A target may name, in `data-land-clear`, the text just above it (the sky's statement). If the landing would leave
 * that text cut by the top edge, land a little further so it sits wholly above the view, never half a line
 * (review UX P2-6). Returns the extra scroll in px (0 when nothing would be cut).
 */
function clearOffset(el: HTMLElement): number {
  const above = el.dataset.landClear ? document.getElementById(el.dataset.landClear) : null;
  if (!above) return 0;
  const px = (v: string) => parseFloat(v) || 0;
  const landing = px(getComputedStyle(el).scrollMarginTop) + px(getComputedStyle(document.documentElement).scrollPaddingTop);
  const shift = el.getBoundingClientRect().top - landing;
  const r = above.getBoundingClientRect();
  const top = r.top - shift, bottom = r.bottom - shift;
  return top < 0 && bottom > 0 ? Math.ceil(bottom) : 0;
}

/** A plain click: no modifier (new tab, new window, download) and the primary button. */
export function isPlainClick(e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}
