"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { registerSchema, type RegisterFormValues } from "./schema";

const TRIAL_DAYS = 14;

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "bureau"
  );
}

async function uniqueAgencySlug(admin: ReturnType<typeof createAdminClient>, agencyName: string): Promise<string> {
  const base = slugify(agencyName);
  let slug = base;
  let suffix = 2;
  for (;;) {
    const { data } = await admin.from("agencies").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix++}`;
  }
}

/**
 * Agency self-registration — the signup the landing page's "Start
 * proefperiode" CTAs point to. Creates a brand-new `agencies` row, not a
 * `companies` row: this account doesn't belong to one of an existing
 * agency's clients, it *is* a new agency, isolated from every other one by
 * RLS (migration 0028) the moment it exists. The new agency's own first
 * client company gets added afterwards through /admin/clients, same flow
 * TDV's own staff already use.
 *
 * Trial starts immediately, no card, no review step — matches what the
 * landing page promises (see supabase/migrations/0025, `agencies.status`).
 * Everything (auth user, agency, profile) goes through the admin client in
 * one trusted server step, same reasoning as before: never trust a
 * client-supplied user id when writing the profile row.
 */
export async function registerAction(input: RegisterFormValues): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." };
  }
  const { fullName, agencyName, email, password } = parsed.data;

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

  const slug = await uniqueAgencySlug(admin, agencyName);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: agencyData, error: agencyError } = await admin
    .from("agencies")
    .insert({ name: agencyName, slug, status: "trialing", trial_ends_at: trialEndsAt })
    .select("id")
    .single();
  if (agencyError) {
    await admin.auth.admin.deleteUser(userData.user.id);
    return { error: `Kon bureau niet aanmaken: ${agencyError.message}` };
  }
  const agencyId = (agencyData as unknown as { id: string }).id;

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userData.user.id, role: "agency_admin", agency_id: agencyId, company_id: null, full_name: fullName });
  if (profileError) {
    await admin.auth.admin.deleteUser(userData.user.id);
    await admin.from("agencies").delete().eq("id", agencyId);
    return { error: `Kon profiel niet aanmaken: ${profileError.message}` };
  }

  return {};
}
