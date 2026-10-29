/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a2540',
          light: '#1e3a5f',
          dark: '#061a30',
        },
        gold: {
          DEFAULT: '#d4af37',
          light: '#f4d03f',
          dark: '#b8941f',
        },
      },
    },
  },
  plugins: [],
};
