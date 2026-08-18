import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createNotifications } from "@/lib/data/notifications";
import type { ProjectRequest, ProjectRequestStatus } from "@/types/domain";

export interface AdminProjectRequest extends ProjectRequest {
  companies: { name: string } | null;
}

export async function getAllProjectRequestsForAdmin(): Promise<AdminProjectRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("project_requests")
    .select("*, companies ( name )")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon projectaanvragen niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminProjectRequest[];
}

/**
 * No assertTdvStaff() guard, matching updateProjectStatusAdmin's existing
 * convention in lib/data/admin/projects.ts — this is only ever called from
 * the /admin/projects page (already role-gated by the admin layout), and
 * project_requests_update_staff (migration 0015) rejects the write outright
 * for anyone else anyway.
 */
export async function updateProjectRequestStatusAdmin(id: string, status: ProjectRequestStatus): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("project_requests").update({ status }).eq("id", id);
  if (error) throw new Error(`Kon status niet bijwerken: ${error.message}`);

  const { data: requestData } = await supabase
    .from("project_requests")
    .select("title, requested_by")
    .eq("id", id)
    .single();
  const request = requestData as { title: string; requested_by: string } | null;
  if (!request) return;

  const STATUS_MESSAGE: Record<ProjectRequestStatus, string> = {
    requested: "is opnieuw geopend",
    awaiting_quote: "wordt voorbereid — je ontvangt een offerte per e-mail",
    project_active: "is goedgekeurd, het project is actief",
    declined: "wordt niet uitgevoerd",
  };

  await createNotifications([
    {
      recipientId: request.requested_by,
      type: "approval",
      title: `Update over je projectaanvraag "${request.title}"`,
      body: `Status: ${STATUS_MESSAGE[status]}.`,
      linkPath: "/projects",
    },
  ]);
}
