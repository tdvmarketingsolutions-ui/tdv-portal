import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentChannel, ContentItem, ContentStatus } from "@/types/domain";
import type { FileCategory } from "@/lib/file-category";

const STORAGE_BUCKET = "client-files";

export interface AdminContentItem extends ContentItem {
  companies: { name: string } | null;
  visual: { id: string; file_name: string } | null;
}

export async function getAllContentItemsForAdmin(): Promise<AdminContentItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("*, companies ( name ), visual:files!content_items_visual_file_id_fkey ( id, file_name )")
    .order("scheduled_for", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Kon contentplanning niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminContentItem[];
}

export async function updateContentItemAdmin(
  id: string,
  input: {
    title?: string;
    caption?: string | null;
    channel?: ContentChannel;
    scheduledFor?: string | null;
    status?: ContentStatus;
  }
): Promise<void> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.caption !== undefined) patch.caption = input.caption;
  if (input.channel !== undefined) patch.channel = input.channel;
  if (input.scheduledFor !== undefined) patch.scheduled_for = input.scheduledFor;
  if (input.status !== undefined) patch.status = input.status;

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("content_items").update(patch).eq("id", id);
  if (error) throw new Error(`Kon content-item niet bijwerken: ${error.message}`);
}

/**
 * Uploads a visual (image/video) for a content item and links it via
 * `visual_file_id`. Uses the RLS-bound client, not the admin client — the
 * caller runs as TDV staff, and `is_tdv_staff()` already grants storage and
 * `files` insert access for any company (see migration 0001), so there's no
 * "RLS can't do this" case here worth reaching for the service role over.
 */
export async function uploadContentItemVisual(contentItemId: string, file: File): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: item, error: itemError } = await supabase
    .from("content_items")
    .select("company_id")
    .eq("id", contentItemId)
    .single();
  if (itemError || !item) throw new Error("Kon content-item niet vinden.");

  const category: FileCategory = file.type.startsWith("video/") ? "video" : "photo";
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${item.company_id}/${category}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { contentType: file.type || undefined });
  if (uploadError) throw new Error(`Kon visual niet uploaden: ${uploadError.message}`);

  const { data: fileRecord, error: fileInsertError } = await supabase
    .from("files")
    .insert({
      company_id: item.company_id,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
      category,
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (fileInsertError || !fileRecord) {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Kon visual niet registreren: ${fileInsertError?.message}`);
  }

  const { error: linkError } = await supabase
    .from("content_items")
    .update({ visual_file_id: (fileRecord as { id: string }).id })
    .eq("id", contentItemId);
  if (linkError) throw new Error(`Kon visual niet koppelen: ${linkError.message}`);
}
