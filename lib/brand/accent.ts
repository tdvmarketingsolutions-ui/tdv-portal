import type { CSSProperties } from "react";

/**
 * Leidt alle accent-tokens af uit één hexkleur (agencies.accent_color, of
 * TDV-terracotta als die leeg/ongeldig is), volgens de HSL-regel uit de
 * huisstijlrichtlijnen v1.1, sectie 0.3. Elke uitkomst haalt WCAG AA:
 * een agency kan dus geen kleur kiezen die het portaal onleesbaar maakt.
 *
 * Bewust de HSL-regel en niet de meng-helper uit sectie 1.3: de richtlijnen
 * vragen er één te kiezen en geven de HSL-regel de voorkeur.
 */

export const TDV_ACCENT = "#AF4B2F";
const INK = "#282828";
const WHITE = "#FFFFFF";
const CANVAS = "#F4F0EE";

type RGB = [number, number, number];
type HSL = [number, number, number]; // h 0–360, s en l 0–100

export function parseHex(hex: string | null | undefined): RGB | null {
  const match = /^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec((hex ?? "").trim());
  if (!match) return null;
  return [parseInt(match[1]!, 16), parseInt(match[2]!, 16), parseInt(match[3]!, 16)];
}

function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** "R G B" — het tripletformaat dat rgb(var(--x) / <alpha-value>) verwacht. */
function triplet([r, g, b]: RGB): string {
  return `${r} ${g} ${b}`;
}

function rgbToHsl([r, g, b]: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s * 100, l * 100];
}

function hslToRgb([h, s, l]: HSL): RGB {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

/** Relatieve luminantie volgens WCAG 2.x. */
function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const ink = parseHex(INK)!;
const white = parseHex(WHITE)!;
const canvas = parseHex(CANVAS)!;

/** Tekstkleur óp het accent: Y > 0,18 → donker, anders wit (sectie 0.3b). */
function textOn(rgb: RGB): RGB {
  return luminance(rgb) > 0.18 ? ink : white;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type AccentTokens = {
  /** De gebruikte accentkleur — verdonkerd als de ingevoerde kleur geen AA haalde. */
  accent: string;
  /** true als de ingevoerde kleur aangepast moest worden voor de leesbaarheid. */
  adjusted: boolean;
  vars: Record<string, string>;
};

export function accentTokens(input: string | null | undefined): AccentTokens {
  const source = parseHex(input) ?? parseHex(TDV_ACCENT)!;
  const [h, s, l0] = rgbToHsl(source);

  // (a) accent: L in stappen van 3 omlaag tot de beste tekstkleur 4,5:1 haalt.
  let l = l0;
  let accent = source;
  while (contrast(accent, textOn(accent)) < 4.5 && l > 0) {
    l = Math.max(0, l - 3);
    accent = hslToRgb([h, s, l]);
  }
  const adjusted = accent.some((v, i) => v !== source[i]);

  // hover/pressed: zelfde H en S, L − 10 (minimaal 12%).
  const hover = hslToRgb([h, s, Math.max(12, l - 10)]);
  // zachte achtergrond: S hooguit 45%, L 94%.
  const soft = hslToRgb([h, Math.min(s, 45), 94]);

  // accent als tekst: L omlaag tot 4,5:1 op canvas én op wit.
  let lt = l;
  let text = accent;
  while ((contrast(text, canvas) < 4.5 || contrast(text, white) < 4.5) && lt > 0) {
    lt = Math.max(0, lt - 3);
    text = hslToRgb([h, s, lt]);
  }

  // dark mode: L in stappen van 4 omhoog tot 4,5:1 op #282828.
  let ld = l0;
  let darkAccent = source;
  while (contrast(darkAccent, ink) < 4.5 && ld < 100) {
    ld = Math.min(100, ld + 4);
    darkAccent = hslToRgb([h, s, ld]);
  }
  const darkSoft = hslToRgb([h, Math.min(s, 35), 20]);
  const darkHover = hslToRgb([h, s, clamp(ld + 6, 0, 100)]);

  return {
    accent: toHex(accent),
    adjusted,
    vars: {
      "--accent-l": triplet(accent),
      "--accent-l-fg": triplet(textOn(accent)),
      "--accent-l-dark": triplet(hover),
      "--accent-l-soft": triplet(soft),
      "--accent-l-text": triplet(text),
      // Dark-mode-waarden; app/globals.css kiest ze onder .dark.
      "--accent-d": triplet(darkAccent),
      "--accent-d-fg": triplet(textOn(darkAccent)),
      "--accent-d-dark": triplet(darkHover),
      "--accent-d-soft": triplet(darkSoft),
    },
  };
}

/**
 * Inline `style` voor de (portal)/(admin)-layoutwrapper (die ook de class
 * `accent-scope` draagt, zie app/globals.css). undefined zonder eigen
 * agency-kleur: dan gelden de TDV-standaardwaarden uit globals.css.
 */
export function agencyAccentStyle(accentColor: string | null | undefined): CSSProperties | undefined {
  if (!parseHex(accentColor)) return undefined;
  return accentTokens(accentColor).vars as CSSProperties;
}
