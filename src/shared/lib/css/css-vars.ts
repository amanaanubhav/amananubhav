import type { CSSProperties } from 'react';

/** Inline style object that may also carry CSS custom properties (`--name`). */
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;
