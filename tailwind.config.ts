import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],

  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        cyber: ['var(--font-jetbrains-mono)', 'monospace'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        'float-nebula': 'float-nebula 20s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        'rotate-slow': 'rotate-slow 30s linear infinite',
        drift: 'drift 25s ease-in-out infinite',
      },
    },
  },

  darkMode: 'class',

  plugins: [],
};

export default config;
