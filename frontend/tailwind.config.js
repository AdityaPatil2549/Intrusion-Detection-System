/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#171717',
          700: '#262626',
        },
        neon: {
          cyan: '#00f3ff',
          magenta: '#ff00ff',
          green: '#00ff3f',
          red: '#ff003c',
          yellow: '#f3ff00'
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
