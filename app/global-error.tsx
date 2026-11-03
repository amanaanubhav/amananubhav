'use client';

import { THEME_ALPHA, THEME_COMPOSITE, THEME_EXTENDED, THEME_PALETTE } from '@/shared/config';

/*
 * Root error boundary (§H.11). It replaces the root layout, so global CSS, fonts and tokens.css may not load:
 * everything is inline, read from the generated Night palette (THEME_PALETTE / THEME_EXTENDED) so it never drifts
 * from tokens.css, with Georgia / serif fallbacks. Palette Update 1.1 (§11): the steel Night ground and surfaces every
 * page but / wears (R1), the aquamarine action tier on the primary (with its metal gloss) and a satin-steel secondary.
 */

/** `rgb(r g b / a)` from a generated hex and alpha, so the inline states stay on the token values. */
function rgba(hex: string, alpha: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
}

const NIGHT_ALPHA = THEME_ALPHA.night;
const NIGHT_GLASS = THEME_COMPOSITE.night;

const NIGHT = {
  ground: THEME_EXTENDED.night['ground-steel'],
  ink: THEME_PALETTE.night.ink,
  muted: THEME_PALETTE.night['ink-muted'],
  surface2: THEME_EXTENDED.night['surface-2-steel'],
  surface3: THEME_EXTENDED.night['surface-3-steel'],
  steel: THEME_EXTENDED.night.steel,
  action: THEME_EXTENDED.night.action,
  onAction: THEME_EXTENDED.night['on-action'],
  actionHover: THEME_EXTENDED.night['action-hover'],
  actionPressed: THEME_EXTENDED.night['action-pressed'],
  focusRing: THEME_EXTENDED.night['focus-ring-action'],
  focusRingInverse: THEME_EXTENDED.night['focus-ring-inverse'],
  selectionBg: THEME_EXTENDED.night['selection-bg'],
  selectionInk: THEME_EXTENDED.night['selection-ink'],
} as const;

/** .gloss-metal on the action fill (pale top edge, dark lower edge) and .satin-steel's glass top / refract edges. */
const GLOSS_METAL = `inset 0 1px 0 ${rgba(NIGHT_GLASS['glass-highlight'].hex, NIGHT_ALPHA['alpha-edge'])}, inset 0 -1px 0 ${rgba(NIGHT_GLASS['glass-shadow'].hex, NIGHT_ALPHA['alpha-edge'])}`;
const SATIN_STEEL = `inset 0 1px 0 ${rgba(NIGHT_GLASS['glass-highlight'].hex, NIGHT_GLASS['glass-highlight'].alpha)}, inset 0 -1px 0 ${rgba(NIGHT_GLASS['glass-refract'].hex, NIGHT_GLASS['glass-refract'].alpha)}`;

/* The same states globals.css gives every page: action focus ring (ink on the action fill), fill-swap hover on fine
   pointers, pressed fill, aqua selection; system colours under forced colors. The resting fills sit here too, not
   inline: an inline background or border would beat the hover and pressed rules. */
const STATE_CSS = `
.ge-primary{border:none;background:${NIGHT.action};color:${NIGHT.onAction};box-shadow:${GLOSS_METAL}}
.ge-secondary{border:1px solid ${NIGHT.steel};background:${NIGHT.surface2};color:${NIGHT.ink};box-shadow:${SATIN_STEEL}}
.ge-action:focus-visible{outline:2px solid ${NIGHT.focusRing};outline-offset:3px}
.ge-primary:focus-visible{outline-color:${NIGHT.focusRingInverse}}
@media (hover:hover) and (pointer:fine){
.ge-primary:hover{background-color:${NIGHT.actionHover}}
.ge-secondary:hover{border-color:${NIGHT.muted};background-color:${NIGHT.surface3}}
}
.ge-primary:active{background-color:${NIGHT.actionPressed}}
::selection{background:${NIGHT.selectionBg};color:${NIGHT.selectionInk}}
@media (forced-colors:active){.ge-action{border:1px solid ButtonText!important}.ge-action:focus-visible{outline-color:Highlight}}
`;

const ACTION = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
  padding: '0 20px',
  borderRadius: 2,
  fontFamily: 'Georgia, serif',
  fontSize: 16,
  fontWeight: 600,
  textDecoration: 'none',
  cursor: 'pointer',
} as const;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong</title>
        <meta name="theme-color" content={NIGHT.ground} />
        <style>{STATE_CSS}</style>
      </head>
      <body
        style={{
          margin: 0,
          background: NIGHT.ground,
          color: NIGHT.ink,
          fontFamily: 'Georgia, "Times New Roman", serif',
          colorScheme: 'dark',
        }}
      >
        <main
          style={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxSizing: 'border-box',
            maxWidth: 720,
            padding: '96px clamp(16px, 6vw, 72px)',
          }}
        >
          <h1 style={{ margin: 0, fontSize: 'clamp(2.25rem, 1.75rem + 2.2vw, 3.75rem)', lineHeight: 1.05, fontWeight: 700 }}>
            Something went wrong on this page.
          </h1>
          <p style={{ margin: '16px 0 0', fontSize: 20, lineHeight: 1.5 }}>Try again, or head back to base camp.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <button type="button" onClick={reset} className="ge-action ge-primary" style={ACTION}>
              Try again
            </button>
            {/* A full page load on purpose: the root layout itself failed, so start clean. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="ge-action ge-secondary" style={ACTION}>
              Back to base camp
            </a>
          </div>
          {error.digest ? (
            <p style={{ margin: '32px 0 0', fontSize: 14, color: NIGHT.muted, fontFamily: 'ui-monospace, monospace' }}>
              Reference {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
