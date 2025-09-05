/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { slate: { 50: "#f8fafc" } },
    },
  },
  plugins: [],
};
