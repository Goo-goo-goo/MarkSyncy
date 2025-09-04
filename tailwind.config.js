/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./popup.html",
    "./manage.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./dist/manage.html",
    "./dist/**/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
