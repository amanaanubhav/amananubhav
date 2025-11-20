/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // We map these to CSS variables defined in index.css
        'app-bg': 'var(--bg-color)',
        'app-card': 'var(--card-bg)',
        'app-text': 'var(--text-color)',
        'app-text-dim': 'var(--text-dim)',
        'app-accent': 'var(--accent-color)',
        'app-border': 'var(--border-color)',
      },
      backgroundImage: {
        'app-gradient': 'var(--btn-gradient)',
      }
    },
  },
  plugins: [],
}