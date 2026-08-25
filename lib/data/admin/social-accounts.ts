import "server-only";
import { createClient } from "@/lib/supabase/server";
import { assertTdvStaff } from "@/lib/auth/assert-staff";
import type { SocialAccount, SocialPlatform } from "@/types/domain";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["instagram", "facebook", "linkedin"];

/**
 * Returns one entry per platform in SOCIAL_PLATFORMS for the given company,
 * synthesizing a "not_connected" placeholder for any platform without a row
 * — there's no real connect flow yet (see migration 0019), so most
 * companies simply have no rows at all.
 */
export async function getSocialAccountsForCompany(companyId: string): Promise<SocialAccount[]> {
  await assertTdvStaff();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_accounts")
    .select("id, company_id, platform, status, account_label, connected_at")
    .eq("company_id", companyId);

  if (error) throw new Error(`Kon gekoppelde kanalen niet laden: ${error.message}`);
  const byPlatform = new Map((data ?? []).map((row) => [(row as SocialAccount).platform, row as SocialAccount]));

  return SOCIAL_PLATFORMS.map(
    (platform) =>
      byPlatform.get(platform) ?? {
        id: `placeholder-${platform}`,
        company_id: companyId,
        platform,
        status: "not_connected" as const,
        account_label: null,
        connected_at: null,
      }
  );
}
