/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e0c0b',
        surface: {
          DEFAULT: '#1a1715',
          2: '#242019',
          3: '#2e2923',
        },
        border: {
          DEFAULT: '#3a342c',
          light: '#4a433a',
        },
        gold: {
          DEFAULT: '#c9a96e',
          light: '#e0c992',
          dim: '#8a7548',
        },
        txt: {
          DEFAULT: '#e8e0d4',
          dim: '#9a9088',
          muted: '#6b6259',
        },
        accent: {
          rose: '#c47a7a',
          amber: '#c49a5a',
          oud: '#8a6a4a',
          fresh: '#6a9a8a',
          floral: '#a47a9a',
          citrus: '#baa44a',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
