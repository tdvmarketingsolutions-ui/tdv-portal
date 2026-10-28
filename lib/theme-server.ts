import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, parseThemePreference, type ThemePreference } from "@/lib/theme";

export function getThemePreference(): ThemePreference {
  return parseThemePreference(cookies().get(THEME_COOKIE)?.value);
}
