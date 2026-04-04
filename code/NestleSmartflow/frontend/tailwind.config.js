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
        brand: '#1d4ed8', // Blue 700
        brandLight: '#3b82f6', // Blue 500
        brandDark: '#1e3a8a', // Blue 900
        slate: {
            800: '#1e293b',
            900: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}
