/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: channel('--c-bg'),
        surface: channel('--c-surface'),
        surface2: channel('--c-surface2'),
        border: channel('--c-border'),
        primary: channel('--c-primary'),
        primaryDim: channel('--c-primary-dim'),
        text: channel('--c-text'),
        muted: channel('--c-muted'),
        danger: channel('--c-danger'),
        success: channel('--c-success'),
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgb(var(--shadow-color) / 0.25)',
        elevated: '0 12px 40px -12px rgb(var(--shadow-color) / 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
};
