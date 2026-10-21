import localFont from 'next/font/local';

// ./fonts: the latin woff2 files Google Fonts serves for these families (SIL OFL 1.1), self-hosted so dev and build
// never fetch from Google. Refresh: request the css2 URL above each font with a Chrome User-Agent, save its latin url().
// Font loader options must be literals, so Google's latin unicode-range is written out in each declaration; other
// scripts fall through to the fallback stack (no visible copy uses a latin-ext, greek or cyrillic glyph of these fonts).
// next/font/local names the @font-face family after the const it is assigned to, so each font is bound to its family
// name (Archivo, Literata, IBM_Plex_Mono, Manrope) and exported under its role.

/** Display: headings, map labels for built things and peaks, spot heights, stamps, buttons. wght 100-900, wdth 62-125. */
// fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900
const Archivo = localFont({
  src: './fonts/archivo-latin-normal.woff2', weight: '100 900', style: 'normal',
  declarations: [
    { prop: 'font-stretch', value: '62% 125%' },
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
  display: 'swap', variable: '--font-display',
  // The local loader sizes its generated Arial fallback at 102.8% (from the file's metrics), 4% wider than the
  // 98.7% next/font/google used, which re-wraps headings before the swap. globals.css defines the old metrics.
  adjustFontFallback: false,
  fallback: ['Archivo Fallback'],
});
export const display = Archivo;

/** Text: stories, body, captions, log keys, UI copy, labels for water and natural features (italic). */
// fonts.googleapis.com/css2?family=Literata:ital,wght@0,200..900;1,200..900
const Literata = localFont({
  src: [
    { path: './fonts/literata-latin-normal.woff2', weight: '200 900', style: 'normal' },
    { path: './fonts/literata-latin-italic.woff2', weight: '200 900', style: 'italic' },
  ],
  declarations: [
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
  display: 'swap', variable: '--font-text',
  // §B.4.1/§J.2 budget: the opsz axis doubled each file (107 -> 51 KB, 110 -> 52 KB), so it is dropped.
  // Not preloaded: only Archivo (the LCP heading face) is preloaded; the size-adjusted fallback keeps CLS flat.
  preload: false,
  // The generated fallback has one face, sized for the roman; italic log keys came out 11% wide in it and
  // re-wrapped log strips on swap (CLS). globals.css defines 'Literata Fallback' with a roman and an italic face.
  adjustFontFallback: false,
  fallback: ['Literata Fallback'],
});
export const text = Literata;

/** Data: log values, coordinates, altitudes, dates, stack lists, the AI terminal, vault hashes. Never a costume. */
// fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500
const IBM_Plex_Mono = localFont({
  src: [
    { path: './fonts/ibm-plex-mono-latin-normal-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/ibm-plex-mono-latin-normal-500.woff2', weight: '500', style: 'normal' },
  ],
  declarations: [
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
  ],
  display: 'swap', variable: '--font-data', preload: false,
  // The generated fallback is Arial at 135%, which sets figures about 16% wider than Plex Mono and re-wraps log
  // strips and the atlas list on swap (CLS). globals.css defines a 0.6 em monospace fallback (Courier New metrics).
  adjustFontFallback: false,
  fallback: ['IBM Plex Mono Fallback'],
});
export const data = IBM_Plex_Mono;

/** UI: the navbar's wordmark, labels and actions. Even strokes, open shapes, a calm rhythm at 16 px. wght 500-600. */
// fonts.googleapis.com/css2?family=Manrope:wght@500..600 (Manrope by Mikhail Sharanda, SIL OFL 1.1)
const Manrope = localFont({
  src: './fonts/manrope-latin-normal.woff2', weight: '500 600', style: 'normal',
  declarations: [
    { prop: 'unicode-range', value: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    // The file's ascent/descent (106.6% / 30%) set the baseline 0.55 px lower than Archivo did, so labels sat low
    // in the bead. Rebalanced so capitals centre in the 34 px bead within 0.25 px. Chrome rounds ascent and descent
    // to whole px at 16 px (16.4 -> 16 left caps 0.9 px high), so the ascent clears 16.5 px to round to 17.
    { prop: 'ascent-override', value: '103.5%' },
    { prop: 'descent-override', value: '33.9%' },
    { prop: 'line-gap-override', value: '0%' },
  ],
  // Not preloaded (§J.2 budget: 25 KB, only the navbar uses it). globals.css defines 'Manrope Fallback' (Arial
  // and Arial Bold, sized per weight to Manrope's advance, same vertical overrides), so the bar keeps its size
  // when the face swaps in.
  display: 'swap', variable: '--font-ui', preload: false,
  adjustFontFallback: false,
  fallback: ['Manrope Fallback'],
});
export const ui = Manrope;

/** Combined CSS-variable class names, applied to <html>; tailwind fontFamily reads the variables. */
export const fontVariables = [display.variable, text.variable, data.variable, ui.variable].join(' ');
