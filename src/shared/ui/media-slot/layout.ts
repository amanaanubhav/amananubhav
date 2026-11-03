/**
 * Where a MediaSlot sits. It drives the `sizes` preset, the max width and, for a needed placeholder (status
 * `placeholder`, neither optional nor hidden), what production renders in its place (C-05, SYS-7):
 *
 * | layout                               | context                                  | pending, in production   |
 * |--------------------------------------|------------------------------------------|--------------------------|
 * | `standard` (default), `wide`, `bleed`| a spread's plate column                  | `strip`                  |
 * | `inset`, `thumb`                     | a small accessory plate beside copy      | `none`                   |
 * | `album`, `grid`, `astro`             | a cell of an album, grid, row or sequence| `none`                   |
 * | `cover`                              | a story card or reader cover             | `fill`                   |
 *
 * `strip` is one line ("Photo to come: {short}") with no aspect box; `none` renders nothing (wrap grid cells in
 * `empty:hidden`); `fill` is a finished plate of the caller's `fill`, or a generated drawing, with no pending
 * caption. A `strip` slot that is given a `fill` renders the `fill` plate instead (the caller drew it for this
 * slot). Development builds and `?media=spec` show the full pending plate for every layout.
 */
export type MediaLayout = 'standard' | 'wide' | 'bleed' | 'inset' | 'thumb' | 'album' | 'astro' | 'grid' | 'cover';

/** What a needed placeholder renders in production. */
export type MediaPendingMode = 'strip' | 'none' | 'fill';

export const MEDIA_PENDING: Readonly<Record<MediaLayout, MediaPendingMode>> = {
  standard: 'strip',
  wide: 'strip',
  bleed: 'strip',
  inset: 'none',
  thumb: 'none',
  album: 'none',
  astro: 'none',
  grid: 'none',
  cover: 'fill',
};

/** The production mode of a needed placeholder: a strip slot with a caller-drawn `fill` shows that plate instead. */
export function pendingMode(layout: MediaLayout, hasFill: boolean): MediaPendingMode {
  const mode = MEDIA_PENDING[layout];
  return mode === 'strip' && hasFill ? 'fill' : mode;
}

/** `sizes` presets per layout (§D.2). */
export const MEDIA_SIZES: Readonly<Record<MediaLayout, string>> = {
  standard: '(min-width: 1280px) 360px, (min-width: 1024px) 25vw, 100vw',
  wide: '(min-width: 1024px) 66vw, 100vw',
  bleed: '(min-width: 1280px) 45vw, (min-width: 1024px) 50vw, 100vw',
  inset: '200px',
  thumb: '120px',
  album: '(min-width: 768px) 33vw, 50vw',
  astro: '(min-width: 1024px) 960px, 100vw',
  grid: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  cover: '(min-width: 1024px) 560px, (min-width: 768px) 55vw, 100vw',
};

/** Max width classes per layout (the plate never grows past its rendered size). */
export const MEDIA_MAX_WIDTH: Readonly<Partial<Record<MediaLayout, string>>> = {
  inset: 'max-w-[200px]',
  thumb: 'max-w-[120px]',
  astro: 'max-w-[960px]',
};
