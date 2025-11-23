/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5865F2',
        secondary: '#57F287',
        danger: '#ED4245',
        warning: '#FEE75C',
        dark: '#2C2F33',
        darker: '#23272A',
      }
    },
  },
  plugins: [],
}