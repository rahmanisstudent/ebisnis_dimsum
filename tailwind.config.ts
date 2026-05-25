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
          DEFAULT: "#4A7C59",
          dark: "#3A6347",
          light: "#E8F0E4",
        },
        accent: {
          DEFAULT: "#E8773A",
          light: "#FFF0E6",
        },
        cream: "#FDF8F3",
        surface: {
          DEFAULT: "#ffffff",
          soft: "#FAF6F1",
        },
        "border-soft": "#EDE8E3",
        "text-main": "#2D2A26",
        "text-muted": "#8A857E",
        "warm-dark": "#2C2825",
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