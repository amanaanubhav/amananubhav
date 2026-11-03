import { useSyncExternalStore } from 'react';

/**
 * Whether the bottom dock exists (`html[data-dock]`, set by SectionDotNav below 1024 px on its pages; contracts/dock.md).
 * While it does, the chat bead sits in the dock band and is not draggable. False on the server and during hydration.
 */
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dock'] });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.hasAttribute('data-dock');
const getServerSnapshot = () => false;

export function useDocked(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
