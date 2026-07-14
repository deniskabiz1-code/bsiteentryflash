/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: 'var(--app-canvas)',
          surface: 'var(--app-surface)',
          text: 'var(--app-text)',
          muted: 'var(--app-muted)',
          faint: 'var(--app-faint)',
          border: 'var(--app-border)',
          track: 'var(--app-track)',
        },
        brand: {
          green: 'var(--brand-green)',
          greenDark: 'var(--brand-green-dark)',
          greenLight: 'var(--brand-green-light)',
          greenTint: 'var(--brand-green-tint)',
        },

      },
      fontFamily: {
        sans: ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        display: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0, 0, 0, 0.06)',
        pill: '0 2px 8px rgba(0, 0, 0, 0.08)',
        float: '0 4px 24px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};