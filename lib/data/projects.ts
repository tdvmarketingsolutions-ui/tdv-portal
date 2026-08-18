import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveListFilterCompanyId } from "@/lib/staff-view";
import type { Project, ProjectWithRelations } from "@/types/domain";

/**
 * Data-access functions are intentionally thin: they never take a companyId
 * parameter from the caller. RLS policies (see supabase/migrations/0001_init.sql)
 * already scope every query to the signed-in user's company, so there is no
 * "which tenant" decision to get wrong in application code.
 *
 * The one exception is the optional "Bekijk als klant" narrowing below
 * (lib/staff-view.ts) — staff-only, never widens access, see that file.
 */

export async function getProjectsForCurrentUser(): Promise<Project[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };
  const viewCompanyId = resolveListFilterCompanyId(profile);

  let query = supabase.from("projects").select("*").order("deadline", { ascending: true, nullsFirst: false });
  if (viewCompanyId) query = query.eq("company_id", viewCompanyId);

  const { data, error } = await query;
  if (error) throw new Error(`Kon projecten niet laden: ${error.message}`);
  return (data ?? []) as unknown as Project[];
}

export async function getProjectById(projectId: string): Promise<ProjectWithRelations | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `*,
      project_timeline_events (*),
      project_comments (*, profiles ( full_name, avatar_url )),
      tickets ( id, subject, status ),
      files ( id, file_name, category, created_at )`
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(`Kon project niet laden: ${error.message}`);
  return data as ProjectWithRelations | null;
}

export async function addProjectComment(projectId: string, body: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase
    .from("project_comments")
    .insert({ project_id: projectId, author_id: user.id, body });

  if (error) throw new Error(`Kon opmerking niet plaatsen: ${error.message}`);
}
