import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#c0392b",
          dark: "#a93226",
          light: "#fef2f2",
        },
        accent: {
          DEFAULT: "#f5a623",
          light: "#fff8ec",
        },
        cream: "#fdf6f0",
        surface: {
          DEFAULT: "#ffffff",
          soft: "#faf6f1",
        },
        "border-soft": "#f0e8e4",
        "text-main": "#1a1a1a",
        "text-muted": "#6b6560",
        "warm-dark": "#1a0f0d",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
};

export default config;