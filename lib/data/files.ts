import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveListFilterCompanyId, resolveWriteCompanyId } from "@/lib/staff-view";
import type { FileRecord } from "@/types/domain";
import type { FileCategory } from "@/lib/file-category";

const STORAGE_BUCKET = "client-files";

export async function getFilesForCurrentUser(): Promise<FileRecord[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };
  const viewCompanyId = resolveListFilterCompanyId(profile);

  let query = supabase.from("files").select("*").order("created_at", { ascending: false });
  if (viewCompanyId) query = query.eq("company_id", viewCompanyId);

  const { data, error } = await query;
  if (error) throw new Error(`Kon bestanden niet laden: ${error.message}`);
  return (data ?? []) as unknown as FileRecord[];
}

export async function uploadFile(input: {
  file: File;
  category: FileCategory;
  projectId?: string;
}): Promise<FileRecord> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  const companyId = resolveWriteCompanyId(profile);
  if (!companyId) throw new Error("Geen bedrijf gekoppeld aan dit account.");

  const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${companyId}/${input.category}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, input.file, { contentType: input.file.type || undefined });
  if (uploadError) throw new Error(`Kon bestand niet uploaden: ${uploadError.message}`);

  const { data: record, error: insertError } = await supabase
    .from("files")
    .insert({
      company_id: companyId,
      project_id: input.projectId ?? null,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
      category: input.category,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    // Best-effort cleanup so a failed metadata insert doesn't leave an
    // orphaned, invisible object sitting in storage.
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Kon bestand niet registreren: ${insertError.message}`);
  }

  return record as unknown as FileRecord;
}

export async function getFileDownloadUrl(storagePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(storagePath, 60 * 5);
  if (error) throw new Error(`Kon downloadlink niet aanmaken: ${error.message}`);
  return data.signedUrl;
}

export async function deleteFile(fileId: string): Promise<void> {
  const supabase = createClient();

  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();
  if (fetchError) throw new Error(`Kon bestand niet vinden: ${fetchError.message}`);

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([file.storage_path as string]);
  if (storageError) throw new Error(`Kon bestand niet verwijderen uit opslag: ${storageError.message}`);

  const { error: deleteError } = await supabase.from("files").delete().eq("id", fileId);
  if (deleteError) throw new Error(`Kon bestand niet verwijderen: ${deleteError.message}`);
}
