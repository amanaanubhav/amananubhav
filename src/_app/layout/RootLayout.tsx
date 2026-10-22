import type { ReactNode } from 'react';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { SITE, THEME_PALETTE } from '@/shared/config';
import { BootCurtain } from '@/widgets/preloader';

import { AppShell } from '../shell/AppShell';
import { PrePaintScript } from '../shell/PrePaintScript';
import { Providers } from '../shell/Providers';
import 'lenis/dist/lenis.css';
import '../styles/globals.css';
import { fontVariables } from './fonts';
import { PERSON_JSON_LD_HTML } from './person-json-ld';

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Night is the SSR theme; the pre-paint gate script may set data-motion/data-lite before
    // hydration, so the attribute mismatch on <html> is expected (suppressHydrationWarning).
    <html lang="en" data-theme="night" data-motion="on" className={fontVariables} suppressHydrationWarning>
      <head>
        {/* First in <head>: runs during the HTML parse, before first paint (see PrePaintScript). */}
        <PrePaintScript />
        <meta name="theme-color" content={THEME_PALETTE.night.ground} />
      </head>
      <GoogleTagManager gtmId={SITE.gtmId} />
      <body>
        {/* The first-load curtain (the climb): first in <body>, shown only when the pre-paint gate runs it. */}
        <BootCurtain />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${SITE.gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: PERSON_JSON_LD_HTML }}
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
      <GoogleAnalytics gaId={SITE.gaId} />
    </html>
  );
}
