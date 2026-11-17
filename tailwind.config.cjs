/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace']
      },
      colors: {
        bio: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b'
        },
        field: {
          bg: '#0d120e',
          chrome: '#0f1510',
          card: '#161c17',
          border: '#263329'
        },
        obsidian: '#0d120e',
        ivory: '#f4f5f4'
      }
    }
  },
  plugins: []
};
