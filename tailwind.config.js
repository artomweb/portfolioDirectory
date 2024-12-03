/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", // If your HTML is at the root
    "/src/**/*.{html,js}", // If your HTML or JS is inside the `src` folder
    "./script.js",
  ],
  theme: {
    extend: {
      animation: {
        pulse: "pulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        pulse: {
          "0%": { opacity: "0.2" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.2" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["cupcake"],
  },
};
