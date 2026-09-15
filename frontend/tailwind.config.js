/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Fundo escuro esportivo
        night: {
          950: "#0a0f1a",
          900: "#0d1424",
          800: "#131c30",
          700: "#1b2740",
          600: "#26365a",
        },
        brand: {
          DEFAULT: "#22c55e",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        accent: "#38bdf8",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "pulse-live": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.35 } },
        "slide-in": { "0%": { opacity: 0, transform: "translateX(20px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "pulse-live": "pulse-live 1.4s ease-in-out infinite",
        "slide-in": "slide-in 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
