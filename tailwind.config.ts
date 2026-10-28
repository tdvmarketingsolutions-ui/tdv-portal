import type { Config } from "tailwindcss";

// Brand tokens of tdv. marketing (huisstijlrichtlijnen v1.1): beige canvas,
// #282828 ink, terracotta accent. Every component reads color through these
// tokens, so a future refresh of the brand guide is still a one-file change.
const config: Config = {
  // Dark mode (huisstijl v1.1, sectie 0.1): de (portal)/(admin)-layouts zetten
  // server-side "dark" (expliciet donker) of "theme-system" (volg de
  // systeemvoorkeur) op hun wrapper, uit de cookie van lib/theme.ts. De
  // publieke pagina's hebben geen van beide en blijven dus altijd licht.
  darkMode: [
    "variant",
    ["&:is(.dark, .dark *)", "@media (prefers-color-scheme: dark) { &:is(.theme-system, .theme-system *) }"],
  ],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bron: huisstijlrichtlijnen tdv. marketing v1.1, sectie 0.2. ink is
        // #282828 — dezelfde donkere kleur als het logo, de website en het
        // drukwerk. De *-dark varianten zijn klaar voor dark mode, maar die
        // staat nog niet aan (niets zet de .dark-class).
        canvas: {
          DEFAULT: "#F4F0EE", // beige paginagrond
          dark: "#1F1E1D",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#282828",
          sunken: "#E8E1D8", // zand: sidebar, afwisselende secties
          "sunken-dark": "#181716",
          raised: "#FFFFFF", // dropdowns, popovers, toasts (+ schaduw)
          // Niet gebruiken onder tekst in accent- of foutkleur: die halen op
          // #333130 geen 4,5:1. Dialogen en toasts gebruiken daarom surface-dark.
          "raised-dark": "#333130",
        },
        border: {
          DEFAULT: "#E5DDD5",
          dark: "#3A3735",
          strong: "#CAB8A2", // randen van invoervelden, tabelkop
          "strong-dark": "#4A4643",
        },
        ink: {
          DEFAULT: "#282828",
          // #6B6459: 5,2:1 op canvas en 5,9:1 op wit (AA).
          muted: "#6B6459",
          // Alleen voor tekst van 18px+ of placeholders (4,3:1 op canvas).
          subtle: "#7A6F69",
          dark: "#F4F0EE",
          "muted-dark": "#B5ABA4",
          "dark-muted": "#B5ABA4", // alias, zo heet hij in de bestaande code
          "subtle-dark": "#8F8580",
        },
        accent: {
          // rgb(var(--x) / <alpha-value>) houdt opacity-modifiers werkend
          // (bg-accent/10). Standaardwaarden staan in app/globals.css; per
          // agency overschreven door lib/brand/accent.ts (inline style op de
          // (portal)/(admin)-layoutwrapper).
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          fg: "rgb(var(--color-accent-fg) / <alpha-value>)", // tekst óp het accent
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          dark: "rgb(var(--color-accent-dark) / <alpha-value>)", // hover/pressed
          text: "rgb(var(--color-accent-text) / <alpha-value>)", // accent als tekst (AA)
        },
        // Status: DEFAULT = tekst/icoon op canvas/wit, soft = pill-
        // achtergrond, on = tekst op soft. Alles gemeten op WCAG AA.
        new: { DEFAULT: "#3B5B78", soft: "#E3EAF1", on: "#2F4D68", dark: "#8DB0CF", "soft-dark": "#22303D" },
        progress: { DEFAULT: "#2F6B6B", soft: "#DFEDEC", on: "#255858", dark: "#7FBDBB", "soft-dark": "#1F3534" },
        waiting: { DEFAULT: "#8A5A0B", soft: "#F6EAD2", on: "#7A4E08", dark: "#E0A84A", "soft-dark": "#3D311C" },
        done: { DEFAULT: "#3D6B4F", soft: "#E4EDE6", on: "#2F5A40", dark: "#7FB08F", "soft-dark": "#28382E" },
        danger: { DEFAULT: "#A3302A", soft: "#F6E1DE", on: "#8E2722", dark: "#E07A70", "soft-dark": "#422421" },
        // Oude namen (text-status-danger …), blijven werken met de nieuwe
        // waarden zodat niet elk bestand tegelijk moet veranderen.
        status: {
          new: "#3B5B78",
          "new-dark": "#8DB0CF",
          progress: "#2F6B6B",
          "progress-dark": "#7FBDBB",
          waiting: "#8A5A0B",
          "waiting-dark": "#E0A84A",
          done: "#3D6B4F",
          "done-dark": "#7FB08F",
          danger: "#A3302A",
          "danger-dark": "#E07A70",
        },
        // Vaste merkkleuren — enkel voor het TDV-merk zelf (logo, publieke
        // pagina's), nooit voor UI-rollen.
        tdv: { beige: "#F4F0EE", dark: "#282828", sand: "#E8E1D8", sandtext: "#CAB8A2", terra: "#AF4B2F", peach: "#FFBC7D" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      // Titels: Epilogue 600, kleine letters, punt op het einde (sectie 1.6).
      fontSize: {
        display: ["3.5rem", { lineHeight: "1.0", letterSpacing: "-0.05em" }], // 56 — hero
        h1: ["2.25rem", { lineHeight: "1.05", letterSpacing: "-0.05em" }], // 36 — paginatitel
        h2: ["1.5rem", { lineHeight: "1.15", letterSpacing: "-0.04em" }], // 24 — sectie/kaart
        h3: ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }], // 18
        label: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.18em" }], // 11 — LABELS
      },
      borderRadius: {
        xl: "0.625rem", // 10px: knoppen, invoervelden
        "2xl": "1rem", // 16px: kaarten, dialogen
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgb(40 40 40 / 0.06)",
        raised: "0 2px 8px rgb(40 40 40 / 0.07), 0 1px 2px rgb(40 40 40 / 0.05)",
        lg: "0 12px 32px rgb(40 40 40 / 0.12), 0 2px 6px rgb(40 40 40 / 0.06)",
      },
      spacing: { 4.5: "1.125rem", 18: "4.5rem", 22: "5.5rem" },
      maxWidth: { prose: "65ch", page: "72rem" },
      transitionTimingFunction: { brand: "cubic-bezier(.2,.7,.2,1)" },
    },
  },
  plugins: [],
};

export default config;
