// Weergavevoorkeur (huisstijl v1.1, sectie 0.1): standaard volgt het portaal
// de systeeminstelling; in /settings kiest de gebruiker Systeem, Licht of
// Donker. De keuze staat in een cookie zodat de layout de juiste class al
// server-side zet — geen lichte flits bij het laden.

export type ThemePreference = "system" | "light" | "dark";

export const THEME_COOKIE = "tdv-theme";

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "Systeem" },
  { value: "light", label: "Licht" },
  { value: "dark", label: "Donker" },
];

export function parseThemePreference(value: string | undefined | null): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/** Class voor de layoutwrapper; zie de darkMode-variant in tailwind.config.ts. */
export function themeClass(preference: ThemePreference): string {
  if (preference === "dark") return "dark";
  if (preference === "system") return "theme-system";
  return "";
}
