/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        p500: '#6366f1',
        p800: '#3730a3',
        p900: '#312e81',
        g100: '#f3f4f6',
        g300: '#d1d5db',
        g400: '#9ca3af',
        mag: '#d946ef',
      }
    },
  },
  plugins: [],
}
