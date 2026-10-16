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
          // Darkened from the original #78706A: measured 4.29:1 on canvas
          // (#F4F0EE), just under WCAG AA's 4.5:1 for normal text — this
          // color is used everywhere as secondary/meta text, often directly
          // on canvas rather than inside a card. #6B6459 clears 5.16:1 on
          // canvas and stays well clear of AA on surface too.
          muted: "#6B6459",
          dark: "#F5F1EE",
          "dark-muted": "#AEA299",
        },
        accent: {
          // rgb(var(--x) / <alpha-value>) is Tailwind's documented pattern for
          // a CSS-variable-backed color that still supports opacity modifiers
          // (bg-accent/90, dark:bg-accent/10, …) — <alpha-value> is replaced
          // at build time per utility class, --color-accent itself stays a
          // live runtime lookup. Default triplets live in app/globals.css;
          // --color-accent is the one overridden per-agency (inline style on
          // the (portal)/(admin) layout wrapper, see lib/data/agency-branding.ts).
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          dark: "rgb(var(--color-accent-dark) / <alpha-value>)",
        },
        // Measured against each color's real rendering context (Badge.tsx's
        // light tailwind-50 background in light mode, the equivalent
        // X-500/10 overlay composited over surface-dark in dark mode):
        // unlike ink/accent, these never had a separate dark-mode value, so
        // every one of them fell under WCAG AA's 4.5:1 in at least one
        // mode — progress and done even failed in their *own* light-mode
        // badges (3.07:1 and 3.15:1). progress/done/danger are darkened for
        // light mode; all five get a dedicated -dark variant (new/waiting
        // especially needed one — 2.92:1 and 2.67:1 against their dark
        // badge background). Apply as `text-status-x dark:text-status-x-dark`.
        status: {
          new: "#2563EB",
          "new-dark": "#60A5FA",
          progress: "#B45309",
          "progress-dark": "#FBBF24",
          waiting: "#7C3AED",
          "waiting-dark": "#A78BFA",
          done: "#15803D",
          "done-dark": "#4ADE80",
          danger: "#B91C1C",
          "danger-dark": "#F87171",
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
