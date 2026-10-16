/**
 * True when the focused element shows a keyboard focus ring. Focus that follows a mouse click or a tap does not
 * match `:focus-visible`, so it must not pin the navbar open (§J.4 item 1, §C.8 chrome dim) or pull the hover
 * droplet. Browsers without the selector count every focus, which keeps keyboard focus from being obscured.
 */
export function isKeyboardFocus(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true;
  }
}
