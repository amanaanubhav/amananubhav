'use client';

import { BOOT_SKELETON_HTML } from '../config/climb.generated';
import './scene.css';
import './boot.css';

/**
 * The climb to Thorong La (docs/redesign/preloader/design.md): the curtain's skeleton, the first child of
 * <body> in every HTML response and `display: none` unless the pre-paint gate set html[data-boot=run]. The
 * climb script injects the scene into its layer host and runs it; React never reconciles that subtree (static
 * inner HTML, identical for every request), and the curtain hides itself (`hidden`) when it is done.
 *
 * A client component so the skeleton travels once in the HTML and once in the cached JS, never a second
 * time in every response's RSC payload.
 */
export function BootCurtain() {
  return (
    <div id="boot" className="boot" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: BOOT_SKELETON_HTML }} />
  );
}
