/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'matrix-rain': 'matrix 20s linear infinite',
        'glitch1': 'glitch1 2s infinite linear alternate-reverse',
        'glitch2': 'glitch2 3s infinite linear alternate-reverse',
      },
    },
  },
  plugins: [],
};
