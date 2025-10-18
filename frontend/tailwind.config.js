/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tft: {
          gold: '#FFD700',
          silver: '#C0C0C0',
          bronze: '#CD7F32',
          blue: '#1E40AF',
          red: '#DC2626',
          green: '#16A34A',
        }
      }
    },
  },
  plugins: [],
}