/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        volt: {
          DEFAULT: '#D4FF4F',
          dim: 'rgba(212,255,79,0.15)',
        },
        base: '#09090B',
        surface: '#131316',
        card: '#151518',
      },
    },
  },
  plugins: [],
};
