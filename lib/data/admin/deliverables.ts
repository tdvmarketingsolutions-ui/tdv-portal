import "server-only";
import { createClient } from "@/lib/supabase/server";
import { assertTdvStaff } from "@/lib/auth/assert-staff";
import { createNotifications } from "@/lib/data/notifications";

const STORAGE_BUCKET = "client-files";

export async function createDeliverable(input: { projectId: string; title: string }): Promise<{ id: string }> {
  await assertTdvStaff();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("deliverables")
    .insert({ project_id: input.projectId, title: input.title })
    .select("id")
    .single();
  if (error) throw new Error(`Kon deliverable niet aanmaken: ${error.message}`);

  return data as unknown as { id: string };
}

/**
 * Staff-only — the app had no way to add a deliverable_version at all before
 * this (they only ever existed if inserted straight into the database, per
 * the README TODO this closes). version_number is computed here rather than
 * trusted from the caller, so two concurrent uploads can't both land on the
 * same number — not fully race-proof without a DB-level serial/sequence, but
 * good enough for the "one staff member reviewing one project" reality here.
 */
export async function uploadDeliverableVersion(input: { deliverableId: string; file: File }): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: deliverableData, error: deliverableError } = await supabase
    .from("deliverables")
    .select("project_id, title, projects ( company_id ), deliverable_versions ( version_number )")
    .eq("id", input.deliverableId)
    .single();
  if (deliverableError) throw new Error(`Kon deliverable niet laden: ${deliverableError.message}`);

  const deliverable = deliverableData as unknown as {
    project_id: string;
    title: string;
    projects: { company_id: string } | null;
    deliverable_versions: { version_number: number }[];
  };
  const companyId = deliverable.projects?.company_id;
  if (!companyId) throw new Error("Kon geen bedrijf bepalen voor dit project.");

  const nextVersion = deliverable.deliverable_versions.reduce((max, v) => Math.max(max, v.version_number), 0) + 1;

  const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${companyId}/deliverables/${input.deliverableId}/v${nextVersion}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, input.file, { contentType: input.file.type || undefined });
  if (uploadError) throw new Error(`Kon bestand niet uploaden: ${uploadError.message}`);

  const { data: fileRecord, error: fileError } = await supabase
    .from("files")
    .insert({
      company_id: companyId,
      project_id: deliverable.project_id,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
      category: "other",
      uploaded_by: user.id,
    })
    .select("id")
    .single();
  if (fileError) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Kon bestand niet registreren: ${fileError.message}`);
  }
  const fileId = (fileRecord as unknown as { id: string }).id;

  const { error: versionError } = await supabase
    .from("deliverable_versions")
    .insert({ deliverable_id: input.deliverableId, version_number: nextVersion, file_id: fileId });
  if (versionError) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Kon versie niet aanmaken: ${versionError.message}`);
  }

  const { data: clientProfiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", companyId)
    .in("role", ["client_admin", "client_member"]);
  await createNotifications(
    ((clientProfiles ?? []) as { id: string }[]).map((p) => ({
      recipientId: p.id,
      type: "approval" as const,
      title: `Nieuwe versie klaar voor feedback: "${deliverable.title}"`,
      body: `Versie ${nextVersion}`,
      linkPath: `/feedback/${input.deliverableId}?version=${nextVersion}`,
    }))
  );
}
