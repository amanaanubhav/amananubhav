import { useEffect, type RefObject } from 'react';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TEMPLATE', 'NOSCRIPT', 'NEXT-ROUTE-ANNOUNCER']);

/** Elements that stay live beside a modal sheet: its own scrim and live regions (announcements keep working). */
function keepLive(el: Element): boolean {
  return SKIP_TAGS.has(el.tagName) || el.hasAttribute('data-modal-keep') || el.hasAttribute('aria-live');
}

/**
 * While `active`, makes everything outside `ref` inert: the skip link, the navbar, `#content`, the footer
 * and the rail, so neither Tab nor a screen reader's virtual cursor reaches the page hidden behind the
 * mobile chat sheet. Walks from the element up to `<body>` and marks each ancestor's siblings; only the
 * elements it marked are restored, so an `inert` the shell set (the story reader) is left alone.
 */
export function useInertOutside(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const marked: HTMLElement[] = [];
    let node: HTMLElement | null = root;
    while (node && node !== document.body && node.parentElement) {
      const parent: HTMLElement = node.parentElement;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || !(sibling instanceof HTMLElement) || keepLive(sibling)) continue;
        if (sibling.inert) continue;
        sibling.inert = true;
        marked.push(sibling);
      }
      node = parent;
    }

    return () => {
      for (const el of marked) el.inert = false;
    };
  }, [ref, active]);
}
