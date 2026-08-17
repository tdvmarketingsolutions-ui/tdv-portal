"use server";

import { revalidatePath } from "next/cache";
import { updateOwnProfileName } from "@/lib/data/profile";
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
