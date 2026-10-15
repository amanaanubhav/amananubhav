'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#000', color: '#fafafa', fontFamily: 'monospace' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            textAlign: 'center',
          }}
        >
          <h1 style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>Something went wrong</h1>
          {error.digest ? <p style={{ opacity: 0.6, fontSize: 12 }}>{error.digest}</p> : null}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '8px 24px',
              border: '1px solid currentColor',
              borderRadius: 9999,
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
