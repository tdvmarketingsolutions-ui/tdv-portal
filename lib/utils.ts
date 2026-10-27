import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// The custom font sizes from tailwind.config.ts (text-h2, text-label, …)
// must be registered, otherwise tailwind-merge reads them as text *colors*
// and silently drops e.g. text-ink-muted when both are passed to cn().
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "label"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Titels in de huisstijl van tdv.: kleine letters met een punt op het einde
 * ("nog geen projecten."). Alleen de eerste letter gaat naar kleine letters,
 * zodat namen verderop in de titel hun hoofdletter houden.
 */
export function brandTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return trimmed;
  const lowered = trimmed.charAt(0).toLocaleLowerCase("nl-BE") + trimmed.slice(1);
  return /[.!?…]$/.test(lowered) ? lowered : `${lowered}.`;
}
