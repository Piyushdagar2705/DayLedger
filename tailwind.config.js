/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bgBase: '#0F0F11',
        bgPanel: '#1C1C21',
        accent: '#6366F1',
        textPrimary: '#E2E2E8',
        textMuted: '#8888A0',
        success: '#10B981',
        danger: '#EF4444',
        borderSubtle: '#2A2A33',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
