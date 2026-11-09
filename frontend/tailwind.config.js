/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        bautista: {
          red: '#D31018',
          darkRed: '#B30006',
          dark: '#0A0A0C',
          cardDark: '#16161A',
          lightGray: '#F4F4F6',
          accent: '#2563EB',
        },
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
      },
      animation: {
        fadeIn: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
