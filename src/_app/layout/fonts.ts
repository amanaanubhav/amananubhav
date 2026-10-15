import { Archivo, IBM_Plex_Mono, Literata } from 'next/font/google';

/** Display: headings, map labels for built things and peaks, spot heights, stamps, buttons. wght 100-900, wdth 62-125. */
export const display = Archivo({ subsets: ['latin'], axes: ['wdth'], display: 'swap', variable: '--font-display' });

/** Text: stories, body, captions, log keys, UI copy, labels for water and natural features (italic). */
export const text = Literata({
  subsets: ['latin'], style: ['normal', 'italic'], display: 'swap', variable: '--font-text',
  // §B.4.1/§J.2 budget: the opsz axis doubled each file (107 -> 51 KB, 110 -> 52 KB), so it is dropped.
  // Not preloaded: only Archivo (the LCP heading face) is preloaded; the size-adjusted fallback keeps CLS flat.
  preload: false,
  // The generated fallback has one face, sized for the roman; italic log keys came out 11% wide in it and
  // re-wrapped log strips on swap (CLS). globals.css defines 'Literata Fallback' with a roman and an italic face.
  adjustFontFallback: false,
  fallback: ['Literata Fallback'],
});

/** Data: log values, coordinates, altitudes, dates, stack lists, the AI terminal, vault hashes. Never a costume. */
export const data = IBM_Plex_Mono({
  subsets: ['latin'], weight: ['400', '500'], display: 'swap', variable: '--font-data', preload: false,
  // The generated fallback is Arial at 135%, which sets figures about 16% wider than Plex Mono and re-wraps log
  // strips and the atlas list on swap (CLS). globals.css defines a 0.6 em monospace fallback (Courier New metrics).
  adjustFontFallback: false,
  fallback: ['IBM Plex Mono Fallback'],
});

/** Combined CSS-variable class names, applied to <html>; tailwind fontFamily reads the variables. */
export const fontVariables = [display.variable, text.variable, data.variable].join(' ');
