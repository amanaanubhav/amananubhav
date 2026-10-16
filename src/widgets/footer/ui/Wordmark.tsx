import type { CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import styles from './Footer.module.css';

function Letters({ text, rise }: { text: string; rise?: boolean }) {
  return Array.from(text).map((char, index) => (
    <span
      // Static text: the index is the identity of the letter.
      key={index}
      className={rise ? styles.rise : undefined}
      style={rise ? ({ '--d': index + 4 } as CSSProperties) : undefined}
    >
      {char}
    </span>
  ));
}

/**
 * The giant stamp across the foot of the last page (the previous footer's 15vw wordmark, kept and made
 * visible at rest): an outlined Archivo stamp. A fine pointer carries a soft lens that lights the letters
 * in signal to water (see useFooterPointer); keyboard focus anywhere in the footer warms the whole stamp,
 * and touch screens show it faintly warm. Decorative: the name is in the copyright line.
 */
export function Wordmark({ text }: { text: string }) {
  return (
    <div data-wordmark="" className={styles.wordmark} aria-hidden="true">
      <p className={cn(styles.word, styles.wordBase)}>
        <Letters text={text} rise />
      </p>
      <p className={cn(styles.word, styles.wordWarm)}>
        <Letters text={text} />
      </p>
      <div data-lens="" className={styles.lens}>
        <div data-lens-copy="" className={styles.lensCopy}>
          <p className={cn(styles.word, styles.wordLit)}>
            <Letters text={text} />
          </p>
        </div>
      </div>
    </div>
  );
}
