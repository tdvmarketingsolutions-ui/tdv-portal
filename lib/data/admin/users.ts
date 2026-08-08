import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/domain";

export interface AdminUser extends Profile {
  companies: { name: string } | null;
}

export function isServiceRoleConfigured(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, companies ( name )")
    .order("full_name");

  if (error) throw new Error(`Kon gebruikers niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminUser[];
}

export async function updateUserRole(userId: string, role: UserRole, companyId: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, company_id: companyId })
    .eq("id", userId);

  if (error) throw new Error(`Kon rol niet bijwerken: ${error.message}`);
}

/**
 * Inviting a user requires creating an auth.users row, which RLS can never
 * express (it's not a table clients or staff insert into directly) — this is
 * the genuine "RLS can't do this" case CLAUDE.md carves out for the
 * service-role client. Throws a clear, distinct error when the key isn't
 * configured yet so the UI can show a "not set up" state instead of a raw
 * Supabase error.
 */
export async function inviteUser(input: {
  email: string;
  role: UserRole;
  companyId: string | null;
}): Promise<void> {
  if (!isServiceRoleConfigured()) {
    throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email);
  if (error) throw new Error(`Kon uitnodiging niet versturen: ${error.message}`);

  // There is no trigger that auto-provisions a `profiles` row when a new
  // auth.users row appears — every account needs one inserted explicitly.
  // profiles has no client-facing INSERT policy at all (by design: regular
  // staff never insert profiles outside this flow), so this has to go
  // through the admin client, same as the auth.users creation just above.
  const userId = data.user.id;
  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: userId, role: input.role, company_id: input.companyId });

  if (profileError) throw new Error(`Uitnodiging verstuurd, maar profiel aanmaken mislukte: ${profileError.message}`);
}
