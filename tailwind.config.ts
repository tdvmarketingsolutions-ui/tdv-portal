import type { Config } from "tailwindcss";

// NOTE: These are placeholder brand tokens (premium, minimal, dark-accented —
// matching the brief's Notion/Linear/Stripe reference). Swap the hex values
// below for TDV's actual brand guide once available; every component in the
// app reads color through these tokens, so it's a one-file change.
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
          DEFAULT: "#FAFAF9", // page background, light mode
          dark: "#0B0C0E",    // page background, dark mode
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#141518",
        },
        border: {
          DEFAULT: "#E7E5E4",
          dark: "#26282C",
        },
        ink: {
          DEFAULT: "#16171A", // primary text
          muted: "#6B6E73",   // secondary text
          dark: "#F4F4F5",
          "dark-muted": "#9A9DA3",
        },
        accent: {
          DEFAULT: "#1C4235", // deep forest — TDV primary accent (placeholder)
          soft: "#E7EFEC",
          dark: "#3E7A64",
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
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
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
