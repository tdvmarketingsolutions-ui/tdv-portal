import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveListFilterCompanyId } from "@/lib/staff-view";
import type { Deliverable, DeliverableVersion, DeliverableComment, FeedbackStatus } from "@/types/domain";

export interface DeliverableSummary extends Deliverable {
  projects: { name: string } | null;
  deliverable_versions: { id: string; version_number: number; status: FeedbackStatus }[];
}

export interface DeliverableWithVersions extends Deliverable {
  projects: { name: string } | null;
  deliverable_versions: (DeliverableVersion & {
    files: { id: string; storage_path: string; file_name: string; mime_type: string | null } | null;
    deliverable_comments: (DeliverableComment & {
      profiles?: { full_name: string | null; avatar_url: string | null } | null;
    })[];
  })[];
}

export async function getDeliverablesForCurrentUser(): Promise<DeliverableSummary[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };
  const viewCompanyId = resolveListFilterCompanyId(profile);

  // `!inner` so a "Bekijk als klant" filter on the joined project's
  // company_id is possible — harmless when no filter is applied below, since
  // every deliverable has a project (project_id is a required FK).
  let query = supabase
    .from("deliverables")
    .select(`*, projects!inner ( name, company_id ), deliverable_versions ( id, version_number, status )`)
    .order("created_at", { ascending: false });
  if (viewCompanyId) query = query.eq("projects.company_id", viewCompanyId);

  const { data, error } = await query;
  if (error) throw new Error(`Kon feedback niet laden: ${error.message}`);
  return (data ?? []) as unknown as DeliverableSummary[];
}

export async function getDeliverableById(id: string): Promise<DeliverableWithVersions | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliverables")
    .select(
      `*, projects ( name ),
      deliverable_versions (
        *,
        files ( id, storage_path, file_name, mime_type ),
        deliverable_comments ( *, profiles ( full_name, avatar_url ) )
      )`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Kon deliverable niet laden: ${error.message}`);
  return data as unknown as DeliverableWithVersions | null;
}

export async function addDeliverableComment(input: {
  deliverableVersionId: string;
  body: string;
  anchorX?: number;
  anchorY?: number;
  anchorPage?: number;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase.from("deliverable_comments").insert({
    deliverable_version_id: input.deliverableVersionId,
    author_id: user.id,
    body: input.body,
    anchor_x: input.anchorX ?? null,
    anchor_y: input.anchorY ?? null,
    anchor_page: input.anchorPage ?? null,
  });

  if (error) throw new Error(`Kon opmerking niet plaatsen: ${error.message}`);
}

export async function updateDeliverableVersionStatus(
  versionId: string,
  status: FeedbackStatus
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("deliverable_versions").update({ status }).eq("id", versionId);
  if (error) throw new Error(`Kon status niet bijwerken: ${error.message}`);
}

export async function getSignedFileUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from("client-files").createSignedUrl(storagePath, 60 * 10);
  if (error) throw new Error(`Kon voorvertoning niet laden: ${error.message}`);
  return data.signedUrl;
}
