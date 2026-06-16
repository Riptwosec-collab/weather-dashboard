/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',          // toggled by html.dark / html.light
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // semantic tokens for theming
        panel: {
          bg:     'var(--panel-bg)',
          border: 'var(--panel-border)',
        },
      },
    },
  },
  plugins: [],
};
