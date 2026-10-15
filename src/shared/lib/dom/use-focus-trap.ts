import { useEffect, type RefObject } from 'react';

import { getTabbable } from './focusable';

export interface FocusTrapOptions {
  /** Element to focus on activation; default: the first tabbable element, else the container. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** Return focus to the opener on deactivation (default true). */
  returnFocus?: boolean;
}

/* Only the most recently activated trap handles Tab and focus escapes (vault above terminal). */
const trapStack: symbol[] = [];
const isTop = (token: symbol) => trapStack[trapStack.length - 1] === token;

/** Return keys whose opener lives in the chat header fall back to the chat launcher (§C.3). */
function fallbackKeys(key: string | null): string[] {
  if (!key) return [];
  return key.startsWith('chat-') && key !== 'chat-launcher' ? [key, 'chat-launcher'] : [key];
}

function isUsable(el: HTMLElement): boolean {
  return el.isConnected && !el.closest('[inert]') && el.getClientRects().length > 0;
}

function findByKey(key: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-return-focus="${CSS.escape(key)}"]`);
  for (const el of Array.from(candidates)) {
    if (isUsable(el)) return el;
  }
  return null;
}

/*
 * The shell unmounts the navbar and the chat in the same commit that opens the terminal or vault, so by
 * the time a trap activates (a passive effect, or after the vault chunk loads) the opener is gone and
 * focus sits on <body>. One capture-phase click listener remembers the `data-return-focus` key of the
 * last clicked element (keyboard activation of a button also fires `click`) so the trap can still use it.
 */
let lastClickedKey: string | null = null;
if (typeof document !== 'undefined') {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      lastClickedKey =
        target instanceof Element
          ? (target.closest<HTMLElement>('[data-return-focus]')?.dataset.returnFocus ?? null)
          : null;
    },
    true,
  );
}

/** Frames to keep looking for the key's element after falling back (the chrome may remount late). */
const KEY_RETRY_FRAMES = 20;

function restoreFocus(container: HTMLElement, opener: HTMLElement | null, key: string | null): void {
  const content = document.getElementById('content');
  /** Focus is lost: nowhere, on `#content` (the last fallback) or still inside the closing panel. */
  const isLost = () => {
    const current = document.activeElement;
    return (
      !(current instanceof HTMLElement) ||
      current === document.body ||
      current === content ||
      !current.isConnected ||
      container.contains(current)
    );
  };
  const focusByKey = (): boolean => {
    for (const candidate of fallbackKeys(key)) {
      const el = findByKey(candidate);
      if (el) {
        el.focus({ preventScroll: true });
        return true;
      }
    }
    return false;
  };
  const retry = (frames: number) => {
    if (frames <= 0 || !isLost()) return;
    if (!focusByKey()) requestAnimationFrame(() => retry(frames - 1));
  };

  // Two frames: the shell remounts the navbar and the chat after the overlay closes.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!isLost()) return; // the visitor already put focus somewhere on purpose

      if (opener && isUsable(opener)) {
        opener.focus({ preventScroll: true });
        return;
      }
      if (focusByKey()) return;
      content?.focus({ preventScroll: true });
      // `#content` may be inert (story open) or the keyed opener may not be laid out yet: keep looking briefly.
      if (key) requestAnimationFrame(() => retry(KEY_RETRY_FRAMES));
    });
  });
}

/**
 * Keeps keyboard focus inside `ref` while `active` (§C.3). On activation it records the opener
 * (and its `data-return-focus` key, or the last clicked opener's key when the opener already unmounted) and focuses `initialFocus`, the first tabbable element or the
 * container, unless focus is already inside. On deactivation it returns focus to the opener, else
 * to the first `[data-return-focus="<key>"]`, else to `#content`.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  opts: FocusTrapOptions = {},
): void {
  const { initialFocus, returnFocus = true } = opts;

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const token = Symbol('focus-trap');
    trapStack.push(token);

    const activeEl = document.activeElement;
    const opener = activeEl instanceof HTMLElement && activeEl !== document.body ? activeEl : null;
    // No live opener (it unmounted with the chrome): use the key of the element that was just clicked.
    const key = opener
      ? (opener.closest<HTMLElement>('[data-return-focus]')?.dataset.returnFocus ?? null)
      : lastClickedKey;

    const focusContainer = () => {
      if (!container.hasAttribute('tabindex')) container.tabIndex = -1;
      container.focus({ preventScroll: true });
    };

    const frame = requestAnimationFrame(() => {
      if (container.contains(document.activeElement)) return;
      const target = initialFocus?.current ?? getTabbable(container)[0];
      if (target) target.focus({ preventScroll: true });
      else focusContainer();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !isTop(token)) return;
      const items = getTabbable(container);
      if (items.length === 0) {
        event.preventDefault();
        focusContainer();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const outside = !container.contains(current);
      if (event.shiftKey && (current === first || current === container || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isTop(token)) return;
      const target = event.target;
      if (target instanceof Node && container.contains(target)) return;
      const first = getTabbable(container)[0];
      if (first) first.focus({ preventScroll: true });
      else focusContainer();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      const index = trapStack.indexOf(token);
      if (index !== -1) trapStack.splice(index, 1);
      if (returnFocus) restoreFocus(container, opener, key);
    };
  }, [active, ref, initialFocus, returnFocus]);
}
