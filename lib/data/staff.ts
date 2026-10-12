import "server-only";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Staff profile ids for the agency that owns `companyId` — for "notify all
 * staff" sends with no single assignee (a brand-new ticket, a client comment
 * with nobody assigned yet). Uses the admin client because the caller is
 * often a client, and profiles_select (migration 0028) only lets a client
 * see their own profile, not staff rows — there's no RLS-legal way for a
 * client session to resolve "who works at my agency".
 *
 * Not a trust escalation: `companyId` must already be resolved server-side
 * from the caller's own session (resolveWriteCompanyId, or a row the caller
 * already has RLS access to) rather than taken from client input — every
 * call site in lib/data/*.ts already follows that rule for other reasons.
 */
export async function getStaffProfileIdsForAgency(companyId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: company } = await admin.from("companies").select("agency_id").eq("id", companyId).single();
  if (!company) return [];

  const { data: staff } = await admin
    .from("profiles")
    .select("id")
    .eq("agency_id", (company as { agency_id: string }).agency_id)
    .in("role", ["agency_admin", "agency_staff"]);
  return ((staff ?? []) as { id: string }[]).map((s) => s.id);
}
