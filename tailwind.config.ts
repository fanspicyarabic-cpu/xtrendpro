import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc8fc",
          400: "#36aaf7",
          500: "#0c8ee9",
          600: "#0170c7",
          700: "#0259a1",
          800: "#064b85",
          900: "#0b3f6f",
          950: "#07284a",
        },
        accent: {
          500: "#ff007a",
          600: "#e6006e",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(12, 142, 233, 0.4)" },
          "100%": { boxShadow: "0 0 30px rgba(255, 0, 122, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
