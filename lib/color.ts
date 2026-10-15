import type { CSSProperties } from "react";

/**
 * "#RRGGBB" -> "R G B" (e.g. "#AF4B2F" -> "175 75 47"), the space-separated
 * triplet format Tailwind's rgb(var(--x) / <alpha-value>) pattern expects
 * for --color-accent (see tailwind.config.ts). Returns null for anything
 * that isn't a plain 6-digit hex color, so a bad/legacy value in the
 * database falls back to the CSS default instead of breaking every
 * accent-colored element on the page.
 */
export function hexToRgbTriplet(hex: string): string | null {
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex.trim());
  if (!match) return null;

  const r = parseInt(match[1]!, 16);
  const g = parseInt(match[2]!, 16);
  const b = parseInt(match[3]!, 16);
  return `${r} ${g} ${b}`;
}

/**
 * Inline `style` for the (portal)/(admin) layout wrapper that overrides
 * --color-accent for the signed-in user's agency. undefined when there's
 * nothing to override, so the CSS default in app/globals.css (TDV's own
 * terracotta) applies — covers TDV itself and any agency that hasn't set a
 * custom color yet.
 */
export function agencyAccentStyle(accentColor: string | null | undefined): CSSProperties | undefined {
  const triplet = accentColor ? hexToRgbTriplet(accentColor) : null;
  return triplet ? ({ "--color-accent": triplet } as CSSProperties) : undefined;
}
