import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'dist/**',
    'next-env.d.ts',
    '.claude/**',
    '.playwright/**',
    '.playwright-cli/**',
    '.vercel/**',
    'public/boot/**', // generated, minified (npm run gen:preloader)
    // The Life page's reviewed design prototype and its sky engine: plain browser JS kept as the design reference
    // (its `useFont` helper is not a React hook). The shipped port lives in src/_pages/personal/lib/sky-engine.ts.
    'docs/redesign/life/prototype/**',
    'docs/redesign/life/sky/**',
  ]),
]);
