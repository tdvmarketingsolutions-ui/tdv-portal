import "server-only";
import { createClient } from "@/lib/supabase/server";
import { assertTdvStaff } from "@/lib/auth/assert-staff";
import type { Agency } from "@/types/domain";

const LOGO_BUCKET = "agency-logos";

export type AgencyBrandingSettings = Pick<Agency, "id" | "name" | "brand_name" | "logo_url" | "accent_color" | "support_email">;

async function getOwnAgencyId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", user.id).single();
  const agencyId = (profile as { agency_id: string } | null)?.agency_id;
  if (!agencyId) throw new Error("Geen bureau gekoppeld aan dit account.");
  return agencyId;
}

export async function getAgencyForSettings(): Promise<AgencyBrandingSettings> {
  await assertTdvStaff();
  const supabase = createClient();
  const agencyId = await getOwnAgencyId();

  const { data, error } = await supabase
    .from("agencies")
    .select("id, name, brand_name, logo_url, accent_color, support_email")
    .eq("id", agencyId)
    .single();

  if (error) throw new Error(`Kon bureau-instellingen niet laden: ${error.message}`);
  return data as AgencyBrandingSettings;
}

export async function updateAgencyBranding(input: {
  brandName: string | null;
  accentColor: string | null;
  supportEmail: string | null;
}): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const agencyId = await getOwnAgencyId();

  const { error } = await supabase
    .from("agencies")
    .update({
      brand_name: input.brandName,
      accent_color: input.accentColor,
      support_email: input.supportEmail,
    })
    .eq("id", agencyId);

  if (error) throw new Error(`Kon branding niet bijwerken: ${error.message}`);
}

/**
 * Same reasoning as uploadCompanyLogo (lib/data/admin/companies.ts): the
 * bucket is public so logo_url is its public URL directly, and a
 * timestamped filename avoids showing a stale cached logo right after a
 * replace. Path convention here is `${agency_id}/${filename}`, checked
 * against current_agency_id() by the storage policies in migration 0032.
 */
export async function uploadAgencyLogo(file: File): Promise<string> {
  await assertTdvStaff();
  const supabase = createClient();
  const agencyId = await getOwnAgencyId();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${agencyId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Kon logo niet uploaden: ${uploadError.message}`);

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase.from("agencies").update({ logo_url: data.publicUrl }).eq("id", agencyId);
  if (updateError) throw new Error(`Kon logo niet koppelen: ${updateError.message}`);

  return data.publicUrl;
}

export async function removeAgencyLogo(): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const agencyId = await getOwnAgencyId();

  const { error } = await supabase.from("agencies").update({ logo_url: null }).eq("id", agencyId);
  if (error) throw new Error(`Kon logo niet verwijderen: ${error.message}`);
}
