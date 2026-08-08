import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
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
    .select("id, name, slug, created_at, projects(count), profiles(count)")
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
