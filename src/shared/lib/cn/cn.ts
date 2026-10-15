import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge, validators } from 'tailwind-merge';

/**
 * tailwind-merge 3 ships Tailwind v4 rules and does not read tailwind.config.ts, so it is taught the
 * project's custom scale names (tailwind.config.ts `theme.extend`). Without this, `text-caption`
 * and the other type-scale classes read as colors and are dropped next to `text-ink`, and the
 * Tailwind 3 `outline` (outline-style: solid) is dropped next to `outline-2`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'ui', 'body', 'lead', 'title', 'h3', 'h2', 'display'],
      radius: ['control', 'panel'],
      shadow: ['float'],
      ease: ['settle', 'glide', 'pen', 'depart', 'breath'],
      container: ['measure', 'content'],
    },
    classGroups: {
      'outline-style': [{ outline: [''] }],
      z: [
        {
          z: [
            'stage', 'grain', 'content', 'rail', 'chat', 'chat-window', 'reader', 'navbar', 'progress',
            'terminal', 'vault', 'theme-edge', 'preloader', 'skip',
          ],
        },
      ],
      duration: [{ duration: ['micro', 'hover', 'ui', 'overlay', 'reveal', 'theme'] }],
    },
  },
  override: {
    classGroups: {
      // Tailwind 3.4: bare `outline` is a style (solid), not a width.
      'outline-w': [
        { outline: [validators.isNumber, validators.isArbitraryVariableLength, validators.isArbitraryLength] },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
