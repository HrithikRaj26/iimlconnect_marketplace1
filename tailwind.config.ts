import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF4FF",
        },
        success: {
          DEFAULT: "#16A34A",
          light: "#ECFDF3",
        },
        surface: "#F7F8FA",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
