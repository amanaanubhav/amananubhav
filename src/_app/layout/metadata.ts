import type { Metadata } from 'next';

import { SITE } from '@/shared/config';

/** Port of the legacy index.html <head> (twitter:url has no Metadata API field and is dropped). */
export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE.title,
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.name }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: `${SITE.url}/`,
    title: SITE.title,
    description: SITE.ogDescription,
    images: [SITE.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.ogDescription,
    images: [SITE.ogImage],
  },
  icons: {
    // G-11 trig-point mark (scripts/brand/build-brand.mjs). The ICO is sized (not `any`) so browsers that
    // support SVG favicons pick the theme-aware SVG over it.
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32 48x48' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/favicon-192x192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  other: {
    title: SITE.title,
  },
};
