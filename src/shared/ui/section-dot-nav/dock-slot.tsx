'use client';

import { useInsertionEffect, useSyncExternalStore, type ReactNode, type ReactPortal } from 'react';
import { createPortal } from 'react-dom';

/*
 * The dock's end slot (CORE-CONTRACT §3c, contracts/dock.md). Below 1024 px SectionDotNav's dock bar holds the
 * section chip and, after it, one slot element; a page puts its own compact controls there (the home legend's Key)
 * so they sit on the same glass, share its height, its scrim and its show / hide, with no positioning of their own.
 * The slot registers only while the dock exists, so <DockSlot> renders nothing at 1024 px and up, on pages without
 * the dock, on the server and during hydration.
 */

let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => slot;

/**
 * How many <DockSlot>s are mounted. A page that puts controls in the dock (the home legend's Key) keeps the dock's
 * full show / hide (shown at the top and after an idle pause); a page with an empty slot keeps the dock out of the
 * way until it is asked for (SectionDotNav). Counted in an insertion effect: those run before any layout effect of
 * the same commit, so SectionDotNav's layout effect already sees a slot user mounted beside it.
 */
let users = 0;

/** Whether any page control is mounted for the dock's slot right now (SectionDotNav only). */
export function dockSlotInUse(): boolean {
  return users > 0;
}
const getServerSnapshot = () => null;

/** Callback ref for the slot element inside the dock bar (SectionDotNav only). */
export function registerDockSlot(el: HTMLElement | null): void {
  if (slot === el) return;
  slot = el;
  listeners.forEach((listener) => listener());
}

/**
 * Renders `children` inside the dock bar, after the section chip, while the dock exists (below 1024 px on a page
 * with SectionDotNav); otherwise renders nothing. The bar is the glass: children add no glass, no fixed
 * positioning and no z-index of their own. A sheet that opens from them is laid out against the bar
 * (`absolute inset-x-0 bottom-full mb-2`) and sets `data-dock-hold` while open. See contracts/dock.md.
 */
export function DockSlot({ children }: { children: ReactNode }): ReactPortal | null {
  const el = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useInsertionEffect(() => {
    users += 1;
    return () => {
      users -= 1;
    };
  }, []);
  return el ? createPortal(children, el) : null;
}
