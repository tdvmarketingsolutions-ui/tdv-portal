"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterFormValues } from "./schema";

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "klant"
  );
}

async function uniqueCompanySlug(admin: ReturnType<typeof createAdminClient>, companyName: string): Promise<string> {
  const base = slugify(companyName);
  let slug = base;
  let suffix = 2;
  for (;;) {
    const { data } = await admin.from("companies").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix++}`;
  }
}

/**
 * Public self-registration. Everything (auth user, company, profile) is
 * created here through the admin client rather than split across a
 * client-side supabase.auth.signUp() call plus a follow-up server action —
 * that would mean trusting a client-supplied user id when writing the
 * profile row, which is unnecessary risk. Doing it all in one trusted,
 * server-only step avoids that entirely. The new company starts out
 * 'pending_review' (see migration 0022) until TDV staff looks it over.
 */
export async function registerAction(input: RegisterFormValues): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }
  const { fullName, companyName, email, password } = parsed.data;

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (userError) {
    if (userError.message.toLowerCase().includes("already been registered") || userError.message.toLowerCase().includes("already exists")) {
      return { error: "Er bestaat al een account met dit e-mailadres." };
    }
    return { error: `Kon account niet aanmaken: ${userError.message}` };
  }

  const slug = await uniqueCompanySlug(admin, companyName);
  const { data: companyData, error: companyError } = await admin
    .from("companies")
    .insert({ name: companyName, slug, onboarding_status: "pending_review" })
    .select("id")
    .single();
  if (companyError) {
    await admin.auth.admin.deleteUser(userData.user.id);
    return { error: `Kon bedrijf niet aanmaken: ${companyError.message}` };
  }
  const companyId = (companyData as unknown as { id: string }).id;

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userData.user.id, role: "client_admin", company_id: companyId, full_name: fullName });
  if (profileError) {
    await admin.auth.admin.deleteUser(userData.user.id);
    await admin.from("companies").delete().eq("id", companyId);
    return { error: `Kon profiel niet aanmaken: ${profileError.message}` };
  }

  return {};
}
