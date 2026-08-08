import type { Config } from "tailwindcss";

// TDV Marketing Solutions' actual brand tokens, extracted from the live
// marketing site (thomasdevoldere.be): warm cream canvas, near-black warm
// ink, terracotta accent. Every component reads color through these tokens,
// so a future refresh from an official brand guide is still a one-file change.
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#F4F0EE", // warm cream page background, light mode
          dark: "#18130F",    // warm near-black page background, dark mode
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#231C17",
        },
        border: {
          DEFAULT: "#E5DDD5",
          dark: "#3A2F27",
        },
        ink: {
          DEFAULT: "#282420", // primary text
          muted: "#78706A",   // secondary text
          dark: "#F5F1EE",
          "dark-muted": "#AEA299",
        },
        accent: {
          DEFAULT: "#AF4B2F", // TDV terracotta — from live site link/CTA color
          soft: "#F1E1D8",
          dark: "#D9855F",
        },
        status: {
          new: "#2563EB",
          progress: "#D97706",
          waiting: "#7C3AED",
          done: "#16A34A",
          danger: "#DC2626",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
