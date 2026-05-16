/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/konsta/**/*.{js,mjs}',
  ],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};
