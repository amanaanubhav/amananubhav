'use client';

/*
 * Root error boundary (§H.11). It replaces the root layout, so global CSS, fonts and tokens may not
 * load: everything is inline, with the Night hexes (the only file allowed hex literals, §J.5) and
 * Georgia / serif fallbacks.
 */

const NIGHT = {
  ground: '#0E2231',
  ink: '#EAF0F2',
  muted: '#A6BAC6',
  edge: '#6F8DA3',
  signal: '#FF9A5C',
  onSignal: '#0E2231',
} as const;

const FOCUS_CSS = `
.ge-action:focus-visible{outline:2px solid ${NIGHT.signal};outline-offset:3px}
.ge-primary:focus-visible{outline-color:${NIGHT.ink};outline-offset:2px}
.ge-action:hover{filter:brightness(1.06)}
::selection{background:${NIGHT.signal};color:${NIGHT.onSignal}}
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
        <style>{FOCUS_CSS}</style>
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
            <button
              type="button"
              onClick={reset}
              className="ge-action ge-primary"
              style={{ ...ACTION, border: 'none', background: NIGHT.signal, color: NIGHT.onSignal }}
            >
              Try again
            </button>
            {/* A full page load on purpose: the root layout itself failed, so start clean. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="ge-action"
              style={{ ...ACTION, border: `1px solid ${NIGHT.edge}`, background: 'transparent', color: NIGHT.ink }}
            >
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
