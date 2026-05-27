/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080810',
        surface: '#13131C',
        surface2: '#1C1C28',
        border: '#262635',
        primary: '#6366F1',
        primaryDim: '#4F46E5',
        text: '#F5F5FA',
        muted: '#8A8A9B',
        danger: '#EF4444',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
