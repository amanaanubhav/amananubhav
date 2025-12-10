/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        cyber: ['JetBrains Mono', 'monospace'], // Custom alias
        colors: {
          // We map these to CSS variables defined in index.css
          'app-bg': 'var(--bg-color)',
          'app-card': 'var(--card-bg)',
          'app-text': 'var(--text-color)',
          'app-text-dim': 'var(--text-dim)',
          'app-accent': 'var(--accent-color)',
          'app-border': 'var(--border-color)',
        },
      },
      backgroundImage: {
        'app-gradient': 'var(--btn-gradient)',
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },

  darkMode: 'class',

  plugins: [],
}