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
  darkMode: 'class', // 启用类模式的夜间模式
  theme: {
    extend: {},
  },
  plugins: [],
}
