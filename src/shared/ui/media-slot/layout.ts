export type MediaLayout = 'standard' | 'wide' | 'bleed' | 'inset' | 'thumb' | 'album' | 'astro';

/** `sizes` presets per layout (§D.2). */
export const MEDIA_SIZES: Readonly<Record<MediaLayout, string>> = {
  standard: '(min-width: 1280px) 360px, (min-width: 1024px) 25vw, 100vw',
  wide: '(min-width: 1024px) 66vw, 100vw',
  bleed: '(min-width: 1280px) 45vw, (min-width: 1024px) 50vw, 100vw',
  inset: '200px',
  thumb: '120px',
  album: '(min-width: 768px) 33vw, 50vw',
  astro: '(min-width: 1024px) 960px, 100vw',
};

/** Max width classes per layout (the plate never grows past its rendered size). */
export const MEDIA_MAX_WIDTH: Readonly<Partial<Record<MediaLayout, string>>> = {
  inset: 'max-w-[200px]',
  thumb: 'max-w-[120px]',
  astro: 'max-w-[960px]',
};
