/**
 * Hex mirror of the colour tokens used by canvas / inline JS (Meander and friends).
 * The CSS custom properties in src/_app/styles/globals.css stay the token source for CSS.
 */
export const PALETTE = {
  cyan500: '#06b6d4',
  cyan400: '#22d3ee',
  violet500: '#8b5cf6',
  pink500: '#ec4899',
  blue500: '#3b82f6',
  deepSpace: '#030014',
  white: '#ffffff',
  zinc50: '#fafafa',
  zinc300: '#d4d4d8',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  zinc900: '#18181b',
} as const satisfies Readonly<Record<string, string>>;

export type PaletteColor = keyof typeof PALETTE;

/** `#rrggbb` + alpha -> `rgba(r, g, b, alpha)` (same spacing as the legacy Meander helpers). */
export function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
