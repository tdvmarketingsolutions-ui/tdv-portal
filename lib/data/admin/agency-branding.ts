import "server-only";
import { createClient } from "@/lib/supabase/server";
import { assertTdvStaff } from "@/lib/auth/assert-staff";
import type { Agency } from "@/types/domain";

const LOGO_BUCKET = "agency-logos";

export type AgencyBrandingSettings = Pick<Agency, "id" | "name" | "brand_name" | "logo_url" | "favicon_url" | "accent_color" | "support_email">;

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
    .select("id, name, brand_name, logo_url, favicon_url, accent_color, support_email")
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

// Beide beelden delen de bucket en het pad `${agency_id}/...`; enkel de
// kolom verschilt. Het favicon is optioneel: zonder valt
// lib/branding-metadata.ts (en app/manifest.ts) terug op het logo.
type AgencyImageColumn = "logo_url" | "favicon_url";

// Uitgeschreven per kolom: een berekende sleutel ({ [column]: … }) maakt
// het type te breed voor de getypeerde update() van supabase-js.
function imageUpdate(column: AgencyImageColumn, url: string | null) {
  return column === "logo_url" ? { logo_url: url } : { favicon_url: url };
}

const FAVICON_TYPES = ["image/png", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];
const FAVICON_MAX_BYTES = 512 * 1024;

/**
 * Same reasoning as uploadCompanyLogo (lib/data/admin/companies.ts): the
 * bucket is public so the stored url is its public URL directly, and a
 * timestamped filename avoids showing a stale cached image right after a
 * replace. Path convention here is `${agency_id}/${filename}`, checked
 * against current_agency_id() by the storage policies in migration 0032.
 */
async function uploadAgencyImage(column: AgencyImageColumn, file: File, label: string): Promise<string> {
  await assertTdvStaff();
  const supabase = createClient();
  const agencyId = await getOwnAgencyId();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const prefix = column === "favicon_url" ? "favicon-" : "";
  const storagePath = `${agencyId}/${prefix}${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Kon ${label} niet uploaden: ${uploadError.message}`);

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase.from("agencies").update(imageUpdate(column, data.publicUrl)).eq("id", agencyId);
  if (updateError) throw new Error(`Kon ${label} niet koppelen: ${updateError.message}`);

  return data.publicUrl;
}

async function removeAgencyImage(column: AgencyImageColumn, label: string): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const agencyId = await getOwnAgencyId();

  const { error } = await supabase.from("agencies").update(imageUpdate(column, null)).eq("id", agencyId);
  if (error) throw new Error(`Kon ${label} niet verwijderen: ${error.message}`);
}

export async function uploadAgencyLogo(file: File): Promise<string> {
  return uploadAgencyImage("logo_url", file, "logo");
}

export async function removeAgencyLogo(): Promise<void> {
  return removeAgencyImage("logo_url", "logo");
}

// Strenger dan het logo: een browsertabblad toont enkel PNG, SVG of ICO
// betrouwbaar, en een favicon van megabytes vertraagt elke paginalading.
export async function uploadAgencyFavicon(file: File): Promise<string> {
  if (!FAVICON_TYPES.includes(file.type)) {
    throw new Error("Gebruik een PNG-, SVG- of ICO-bestand voor het favicon.");
  }
  if (file.size > FAVICON_MAX_BYTES) {
    throw new Error("Het favicon mag hoogstens 512 KB zijn.");
  }
  return uploadAgencyImage("favicon_url", file, "favicon");
}

export async function removeAgencyFavicon(): Promise<void> {
  return removeAgencyImage("favicon_url", "favicon");
}
