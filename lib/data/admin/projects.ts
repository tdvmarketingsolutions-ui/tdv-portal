import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStatus } from "@/types/domain";

export interface AdminProject extends Project {
  companies: { name: string } | null;
}

export async function getAllProjectsForAdmin(): Promise<AdminProject[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, companies ( name )")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon projecten niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminProject[];
}

export async function getAllCompaniesForSelect(): Promise<{ id: string; name: string }[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("companies").select("id, name").order("name");
  if (error) throw new Error(`Kon klanten niet laden: ${error.message}`);
  return (data ?? []) as unknown as { id: string; name: string }[];
}

export async function createProjectAdmin(input: {
  companyId: string;
  name: string;
  description?: string;
  deadline?: string;
}): Promise<{ id: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      company_id: input.companyId,
      name: input.name,
      description: input.description ?? null,
      deadline: input.deadline ?? null,
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Kon project niet aanmaken: ${error.message}`);
  return data as unknown as { id: string };
}

export async function updateProjectStatusAdmin(projectId: string, status: ProjectStatus): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw new Error(`Kon projectstatus niet bijwerken: ${error.message}`);
}

export async function addProjectTimelineEvent(input: {
  projectId: string;
  title: string;
  description?: string;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase.from("project_timeline_events").insert({
    project_id: input.projectId,
    title: input.title,
    description: input.description ?? null,
    created_by: user.id,
  });

  if (error) throw new Error(`Kon tijdlijn-update niet toevoegen: ${error.message}`);
}
