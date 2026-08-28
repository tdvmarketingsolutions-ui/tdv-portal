"use server";

import { revalidatePath } from "next/cache";
import { createCompany, uploadCompanyLogo, removeCompanyLogo } from "@/lib/data/admin/companies";
import { companySchema, type CompanyFormValues } from "./schema";

export async function createCompanyAction(input: CompanyFormValues): Promise<{ error?: string }> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }

  try {
    await createCompany(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon klant niet aanmaken." };
  }

  revalidatePath("/admin/clients");
  return {};
}

export async function uploadCompanyLogoAction(companyId: string, formData: FormData): Promise<{ error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Kies een afbeelding om te uploaden." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Enkel afbeeldingen zijn toegelaten." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "Afbeelding is te groot (max 5 MB)." };
  }

  try {
    await uploadCompanyLogo(companyId, file);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon logo niet uploaden." };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${companyId}`);
  return {};
}

export async function removeCompanyLogoAction(companyId: string): Promise<{ error?: string }> {
  try {
    await removeCompanyLogo(companyId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon logo niet verwijderen." };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${companyId}`);
  return {};
}
