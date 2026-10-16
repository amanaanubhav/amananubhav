'use client';

import { motion } from 'motion/react';
import type { Ref } from 'react';
import type { LiquidHoverValues } from '../model/use-liquid-hover';
import styles from './Navbar.module.css';

interface LiquidHoverProps {
  readonly values: LiquidHoverValues;
  readonly dropRef: Ref<HTMLSpanElement>;
}

/**
 * The hover drop's layers (see `useLiquidHover`). The drop is two round caps and a scaled strip, all opaque, inside
 * a tinted group: the group's opacity composites them as one shape, so the joins never show and the ends stay round
 * however far it stretches. The lights sit in a sibling layer squashed with it. Hidden unless the glass is in
 * liquid mode (fine pointer, motion allowed) and in forced colors.
 */
export function LiquidHover({ values, dropRef }: LiquidHoverProps) {
  const { left, capRight, bodyX, bodyScale, squash, fill, glow, glintX, causticX } = values;
  return (
    <span aria-hidden="true" className={styles.liquid}>
      <motion.span ref={dropRef} className={styles.drop} style={{ scaleY: squash, opacity: fill }}>
        <span className={styles.tint}>
          <motion.i className={styles.cap} style={{ x: left }} />
          <motion.i className={styles.strip} style={{ x: bodyX, scaleX: bodyScale, originX: 0 }} />
          <motion.i className={styles.cap} style={{ x: capRight }} />
        </span>
      </motion.span>
      <motion.span className={styles.drop} style={{ scaleY: squash }}>
        <motion.i className={styles.glint} style={{ x: glintX, opacity: glow }} />
        <motion.i className={styles.caustic} style={{ x: causticX, opacity: fill }} />
      </motion.span>
    </span>
  );
}
