import type { Config } from 'tailwindcss';

/** Every color is a §B.1 role read from the generated tokens (src/_app/styles/tokens.css), so opacity modifiers work. */
const role = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // the `.dark` wrapper stays for any remaining dark: utilities
  future: { hoverOnlyWhenSupported: true }, // hover: styles only where a real hover exists (§B.10)
  theme: {
    extend: {
      colors: {
        ground: role('ground'), surface: role('surface'), 'surface-2': role('surface-2'), sky: role('ground-sky'),
        line: role('line'), 'line-strong': role('line-strong'),
        ink: role('ink'), 'ink-muted': role('ink-muted'),
        signal: role('signal'), 'signal-line': role('signal-line'), 'on-signal': role('on-signal'),
        water: role('water'), success: role('success'), warning: role('warning'), error: role('error'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Arial Narrow', 'sans-serif'],
        body: ['var(--font-text)', 'Georgia', 'serif'],
        data: ['var(--font-data)', 'ui-monospace', 'monospace'],
        // legacy aliases so un-migrated classes still resolve to the new faces
        sans: ['var(--font-text)', 'Georgia', 'serif'],
        serif: ['var(--font-text)', 'Georgia', 'serif'],
        mono: ['var(--font-data)', 'ui-monospace', 'monospace'],
        cyber: ['var(--font-data)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        caption: ['var(--step--1)', { lineHeight: '1.45', letterSpacing: '0.01em' }],
        ui: ['var(--step-0)', { lineHeight: '1.55' }],
        body: ['var(--step-1)', { lineHeight: '1.65' }],
        lead: ['var(--step-2)', { lineHeight: '1.5' }],
        title: ['var(--step-3)', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        h3: ['var(--step-4)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        h2: ['var(--step-5)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        display: ['var(--step-6)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
      },
      borderRadius: { control: '2px', panel: '6px' },
      boxShadow: { float: 'var(--shadow-float)' },
      zIndex: {
        stage: '0', grain: '5', content: '10', rail: '40', chat: '60', 'chat-window': '61', reader: '90',
        navbar: '95', progress: '96', terminal: '100', vault: '105', 'theme-edge': '110', preloader: '120', skip: '130',
      },
      transitionTimingFunction: {
        settle: 'cubic-bezier(0.16, 1, 0.3, 1)', glide: 'cubic-bezier(0.65, 0, 0.35, 1)',
        pen: 'cubic-bezier(0.45, 0.05, 0.25, 1)', depart: 'cubic-bezier(0.55, 0, 1, 0.45)',
        breath: 'cubic-bezier(0.37, 0, 0.63, 1)',
      },
      transitionDuration: { micro: '120ms', hover: '180ms', ui: '280ms', overlay: '450ms', reveal: '800ms', theme: '700ms' },
      maxWidth: { measure: '66ch', content: '1440px' },
    },
  },
  plugins: [],
};
export default config;
