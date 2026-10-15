import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Agency } from "@/types/domain";

export type AgencyBranding = Pick<Agency, "id" | "brand_name" | "logo_url" | "accent_color">;

/**
 * Resolves the signed-in user's own agency branding — client or staff, both
 * have exactly one agency_id (see CLAUDE.md: profiles.agency_id is not
 * nullable, unlike company_id). RLS (agencies_select_own) already scopes
 * this to the caller's own agency, same as every other lib/data read: no
 * agencyId parameter, no manual filtering here.
 *
 * Returns null for a signed-out request (layouts call this after already
 * redirecting unauthenticated users, but this file has no way to assume
 * that) so callers can fall back to TDV's own hardcoded chrome.
 */
export async function getCurrentAgencyBranding(): Promise<AgencyBranding | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
  const agencyId = (profile as { agency_id: string } | null)?.agency_id;
  if (!agencyId) return null;

  const { data, error } = await supabase
    .from("agencies")
    .select("id, brand_name, logo_url, accent_color")
    .eq("id", agencyId)
    .maybeSingle();

  if (error) throw new Error(`Kon agency-branding niet laden: ${error.message}`);
  return data as AgencyBranding | null;
}
