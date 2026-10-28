"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { THEME_COOKIE, parseThemePreference, type ThemePreference } from "@/lib/theme";
import { updateOwnProfileName, updateOwnEmailNotificationPref } from "@/lib/data/profile";
import { editProfileSchema, type EditProfileFormValues } from "./schema";

export async function updateProfileAction(input: EditProfileFormValues): Promise<{ error?: string }> {
  const parsed = editProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await updateOwnProfileName(parsed.data.fullName);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon profiel niet bijwerken." };
  }

  revalidatePath("/settings");
  return {};
}

export async function updateEmailNotificationPrefAction(enabled: boolean): Promise<{ error?: string }> {
  try {
    await updateOwnEmailNotificationPref(enabled);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon voorkeur niet bijwerken." };
  }

  revalidatePath("/settings");
  revalidatePath("/admin/settings");
  return {};
}

export async function updateThemePreferenceAction(preference: ThemePreference): Promise<{ error?: string }> {
  // Alleen een weergavekeuze in een cookie, geen databasewijziging: zo werkt
  // ze meteen bij de volgende render, ook voor staff in /admin.
  const value = parseThemePreference(preference);
  cookies().set(THEME_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  revalidatePath("/", "layout");
  return {};
}
