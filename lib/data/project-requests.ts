import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createNotifications } from "@/lib/data/notifications";
import type { ProjectRequest } from "@/types/domain";

export async function getProjectRequestsForCurrentUser(): Promise<ProjectRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon projectaanvragen niet laden: ${error.message}`);
  return (data ?? []) as unknown as ProjectRequest[];
}

/**
 * No companyId parameter — resolves it from the caller's own profile, same
 * pattern as createTicket/createContentItemForCurrentUser. Matches the
 * project_requests_insert policy (migration 0015), which only allows a
 * client to insert a row for their own company_id.
 */
export async function createProjectRequest(input: { title: string; description?: string }): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id) throw new Error("Geen bedrijf gekoppeld aan dit account.");

  const { error } = await supabase.from("project_requests").insert({
    company_id: profile.company_id,
    title: input.title,
    description: input.description ?? null,
    requested_by: user.id,
  });
  if (error) throw new Error(`Kon projectaanvraag niet versturen: ${error.message}`);

  const { data: staff } = await supabase.from("profiles").select("id").in("role", ["tdv_admin", "tdv_staff"]);
  await createNotifications(
    ((staff ?? []) as { id: string }[]).map((s) => ({
      recipientId: s.id,
      type: "approval",
      title: `Nieuwe projectaanvraag: ${input.title}`,
      body: input.description,
      linkPath: "/admin/projects",
    }))
  );
}
