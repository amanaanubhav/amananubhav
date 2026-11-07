'use client';

import { notebookPrePaintScript } from '../../lib/notebook-pages';

const SCRIPT = notebookPrePaintScript();

/**
 * The notebook's pre-paint script (NOTEBOOK-DESIGN §2.6), built like the shell's `PrePaintScript`: in the server HTML
 * it is an ordinary parser-blocking inline script placed before the book, so `html[data-nb-page]` is set from the hash
 * before the book is parsed and a deep link never paints the wrong page first. On the client React renders the same
 * node as an inert data block (`type="text/plain"`): hydration adopts the server node (the `type` difference is covered
 * by suppressHydrationWarning) and a client render never builds an executable script.
 */
export function NotebookPrePaint() {
  const onServer = typeof window === 'undefined';
  return (
    <script
      type={onServer ? undefined : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
