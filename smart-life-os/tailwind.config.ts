import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#07111f",
        surface: "#0f172a",
        card: "rgba(15, 23, 42, 0.74)",
        thai: "#38bdf8"
      },
      boxShadow: {
        glow: "0 0 40px rgba(56, 189, 248, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
