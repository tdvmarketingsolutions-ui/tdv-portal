import "server-only";
import { createClient } from "@/lib/supabase/server";
import { assertTdvStaff } from "@/lib/auth/assert-staff";

const LOGO_BUCKET = "company-logos";

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  projects: { count: number }[];
  profiles: { count: number }[];
}

export interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  projects: { id: string; name: string; status: string }[];
  profiles: { id: string; full_name: string | null; role: string }[];
}

export async function getCompaniesWithCounts(): Promise<CompanySummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, slug, logo_url, created_at, projects(count), profiles(count)")
    .order("name");

  if (error) throw new Error(`Kon klanten niet laden: ${error.message}`);
  return (data ?? []) as unknown as CompanySummary[];
}

export async function getCompanyById(id: string): Promise<CompanyDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      `id, name, slug, logo_url, created_at,
      projects ( id, name, status ),
      profiles ( id, full_name, role )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Kon klant niet laden: ${error.message}`);
  return data as unknown as CompanyDetail | null;
}

export async function createCompany(input: { name: string; slug: string }): Promise<{ id: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({ name: input.name, slug: input.slug })
    .select("id")
    .single();

  if (error) throw new Error(`Kon klant niet aanmaken: ${error.message}`);
  return data as unknown as { id: string };
}

/**
 * The bucket is public (migration 0021), so logo_url is the bucket's public
 * URL stored directly — no signed-URL regeneration needed to display it
 * anywhere. A timestamped filename (rather than overwriting a fixed name)
 * sidesteps CDN/browser caching showing a stale logo right after a replace.
 */
export async function uploadCompanyLogo(companyId: string, file: File): Promise<string> {
  await assertTdvStaff();
  const supabase = createClient();

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${companyId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Kon logo niet uploaden: ${uploadError.message}`);

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await supabase
    .from("companies")
    .update({ logo_url: data.publicUrl })
    .eq("id", companyId);
  if (updateError) throw new Error(`Kon logo niet koppelen: ${updateError.message}`);

  return data.publicUrl;
}

export async function removeCompanyLogo(companyId: string): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const { error } = await supabase.from("companies").update({ logo_url: null }).eq("id", companyId);
  if (error) throw new Error(`Kon logo niet verwijderen: ${error.message}`);
}
