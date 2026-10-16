import type { CSSProperties } from 'react';
import { VisuallyHidden } from '@/shared/ui/visually-hidden';
import styles from './Footer.module.css';

/**
 * Rolling letters: each letter slides up out of its slot and a signal-coloured twin (`::after`) rolls in
 * behind it, staggered left to right. The parent link drives it on hover and on :focus-visible (CSS in
 * Footer.module.css). The visible letters are hidden from assistive tech; the real label sits beside them.
 * Under reduced motion nothing moves: the twin never shows and the underline carries the state.
 */
export function RollText({ children }: { children: string }) {
  return (
    <>
      <VisuallyHidden>{children}</VisuallyHidden>
      <span aria-hidden="true" className={styles.roll}>
        {Array.from(children).map((char, index) => {
          const glyph = char === ' ' ? ' ' : char;
          return (
            <span
              // Static text: the index is the identity of the letter.
              key={index}
              className={styles.rollChar}
              data-char={glyph}
              style={{ '--i': index } as CSSProperties}
            >
              {glyph}
            </span>
          );
        })}
      </span>
    </>
  );
}
