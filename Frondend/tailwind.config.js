/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-purple": "#663366",
        "primary-purple-dark": "#552B55",
      },
    },
  },
  plugins: [],
};
