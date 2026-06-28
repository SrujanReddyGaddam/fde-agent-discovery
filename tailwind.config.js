/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0E1A',
        surface: '#0f1623',
        panel: '#141d2e',
        border: '#1e2d45',
        accent: '#3B82F6',
        go: '#22c55e',
        caution: '#f59e0b',
        stop: '#ef4444',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
}

