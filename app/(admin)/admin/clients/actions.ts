"use server";

import { revalidatePath } from "next/cache";
import { createCompany } from "@/lib/data/admin/companies";
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
