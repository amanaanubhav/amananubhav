import { useEffect, useEffectEvent } from 'react';

/*
 * One document listener and a stack of active handlers: Escape reaches only the most recently
 * activated one, so stacked overlays (vault above terminal) close one at a time.
 */
const stack: { handle: (event: KeyboardEvent) => void }[] = [];

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || event.isComposing) return;
  stack[stack.length - 1]?.handle(event);
}

/** Calls `handler` on Escape while `active` (default true). */
export function useEscapeKey(handler: (event: KeyboardEvent) => void, active: boolean = true): void {
  const onEscape = useEffectEvent((event: KeyboardEvent) => handler(event));

  useEffect(() => {
    if (!active) return;
    const entry = { handle: (event: KeyboardEvent) => onEscape(event) };
    stack.push(entry);
    if (stack.length === 1) document.addEventListener('keydown', onKeyDown);
    return () => {
      const index = stack.indexOf(entry);
      if (index !== -1) stack.splice(index, 1);
      if (stack.length === 0) document.removeEventListener('keydown', onKeyDown);
    };
  }, [active]);
}
