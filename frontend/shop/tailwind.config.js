/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(-3%)",
            animationTimingFunction: "cubic-bezier(0.5, 0, 0.5, 1.5)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0,0,0.2,1)",
          },
        },
      },
    },
    fontFamily: {
      abeezee: "abeezee",
    },
  },
  plugins: [require("@tailwindcss/aspect-ratio")],
};
