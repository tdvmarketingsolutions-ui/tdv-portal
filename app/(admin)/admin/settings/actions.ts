"use server";

import { revalidatePath } from "next/cache";
import { updateAgencyBranding, uploadAgencyLogo, removeAgencyLogo } from "@/lib/data/admin/agency-branding";
import { brandingSchema, type BrandingFormValues } from "./branding-schema";

export async function updateBrandingAction(input: BrandingFormValues): Promise<{ error?: string }> {
  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await updateAgencyBranding({
      brandName: parsed.data.brandName || null,
      accentColor: parsed.data.accentColor || null,
      supportEmail: parsed.data.supportEmail || null,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon branding niet bijwerken." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return {};
}

export async function uploadAgencyLogoAction(formData: FormData): Promise<{ error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies een bestand om te uploaden." };
  }

  try {
    await uploadAgencyLogo(file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon logo niet uploaden." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return {};
}

export async function removeAgencyLogoAction(): Promise<{ error?: string }> {
  try {
    await removeAgencyLogo();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon logo niet verwijderen." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return {};
}
