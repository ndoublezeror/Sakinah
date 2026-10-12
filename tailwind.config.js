/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pink: {
          primary: '#F6B8CF',
          light: '#FBD5E4',
          dark: '#E89AB8',
          deep: '#D96C99',
        },
        blush: {
          DEFAULT: '#FFF5F8',
          light: '#FFFAFC',
          dark: '#FFE9F0',
        },
        lilac: {
          DEFAULT: '#E8DDFC',
          light: '#F2EDFE',
          dark: '#D0BFF8',
        },
        plum: {
          DEFAULT: '#493344',
          light: '#6B5260',
          dark: '#2E1F2B',
        },
        champagne: {
          DEFAULT: '#E8CB91',
          light: '#F0DDB4',
          dark: '#D4B36F',
        },
        rose: {
          DEFAULT: '#D96C99',
          light: '#E89AB8',
          dark: '#C04B7C',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        arabic: ['Noto Naskh Arabic', 'Amiri', 'serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'gentle-pulse': 'gentle-pulse 2s ease-in-out infinite',
        'pop-in': 'pop-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'check-pop': 'check-pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
