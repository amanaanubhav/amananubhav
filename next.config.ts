import type { NextConfig } from 'next';

/**
 * Client env bridge: NEXT_PUBLIC_* names win, legacy Vite names are fallbacks so the
 * existing .env / .env.local files and Vercel project env keep working unchanged.
 * Undefined keys are omitted. OPENROUTER_API_KEY and GROQ_API_KEY are server-only and are never mapped here.
 */
const CLIENT_ENV_FALLBACKS: Record<string, readonly string[]> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_API'],
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ['VITE_FIREBASE_AUTH_DOMAIN'],
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: ['VITE_FIREBASE_PROJECT_ID'],
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ['VITE_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE'],
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: [
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_MESSAGING',
  ],
  NEXT_PUBLIC_FIREBASE_APP_ID: ['VITE_FIREBASE_APP_ID', 'VITE_FIREBASE_APP'],
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: ['VITE_EMAILJS_SERVICE_ID'],
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_TO_AMAN: ['VITE_EMAILJS_TEMPLATE_ID_TO_AMAN'],
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_TO_VISITOR: ['VITE_EMAILJS_TEMPLATE_ID_TO_VISITOR'],
  NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: ['VITE_EMAILJS_PUBLIC_KEY'],
};

function resolveClientEnv(): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [name, legacyNames] of Object.entries(CLIENT_ENV_FALLBACKS)) {
    const value = [name, ...legacyNames]
      .map((key) => process.env[key])
      .find((candidate): candidate is string => typeof candidate === 'string' && candidate !== '');
    if (value !== undefined) resolved[name] = value;
  }
  return resolved;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: resolveClientEnv(),
  images: { formats: ['image/avif', 'image/webp'] },
  // Runs before hydration on every full load: on '/' it starts the home stage's 3D chunk early (load-in-3d §10).
  instrumentationClientInject: ['./src/shared/ui/stage/early-kick.ts'],
  // The preloader's climb script (public/boot/climb.<hash>.js) is content-hashed by its generator.
  async headers() {
    const immutable = { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' };
    return [{ source: '/boot/:path*', headers: [immutable] }];
  },
};

export default nextConfig;
