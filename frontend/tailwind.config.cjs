/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css}'],
  theme: {
    extend: {
      colors: {
        app: {
          canvas: '#F5F5F7',
          surface: '#FFFFFF',
          text: '#1C1C1E',
          muted: '#8E8E93',
          faint: '#AEAEB2',
          border: '#E5E5EA',
          track: '#EBEBED',
        },
        brand: {
          green: '#34C759',
          greenDark: '#248A3D',
          greenLight: '#EAF9EE',
          greenTint: '#F3FBF5',
        },
        accent: {
          coral: '#FF6B4A',
          coralDark: '#E85A3A',
          coralLight: '#FFF0EC',
          blue: '#007AFF',
          blueLight: '#E8F2FF',
          violet: '#7C5CFC',
          violetLight: '#F0ECFF',
          amber: '#FF9F0A',
          amberLight: '#FFF5E6',
          teal: '#2EC4B6',
          tealLight: '#E6FAF8',
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