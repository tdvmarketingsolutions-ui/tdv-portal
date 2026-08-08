"use server";

import { revalidatePath } from "next/cache";
import { inviteUser, updateUserRole } from "@/lib/data/admin/users";
import { inviteUserSchema, editUserRoleSchema, type InviteUserFormValues, type EditUserRoleFormValues } from "./schema";

export async function inviteUserAction(input: InviteUserFormValues): Promise<{ error?: string }> {
  const parsed = inviteUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await inviteUser({
      email: parsed.data.email,
      role: parsed.data.role,
      companyId: parsed.data.companyId ?? null,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SERVICE_ROLE_NOT_CONFIGURED") {
      return { error: "Gebruikers uitnodigen is nog niet geconfigureerd (ontbrekende service role key)." };
    }
    return { error: err instanceof Error ? err.message : "Kon uitnodiging niet versturen." };
  }

  revalidatePath("/admin/users");
  return {};
}

export async function updateUserRoleAction(
  userId: string,
  input: EditUserRoleFormValues
): Promise<{ error?: string }> {
  const parsed = editUserRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await updateUserRole(userId, parsed.data.role, parsed.data.companyId ?? null);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon rol niet bijwerken." };
  }

  revalidatePath("/admin/users");
  return {};
}
