import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentChannel, ContentItem, ContentStatus } from "@/types/domain";
import type { FileCategory } from "@/lib/file-category";
import { assertTdvStaff } from "@/lib/auth/assert-staff";
import { createNotifications } from "@/lib/data/notifications";

const STORAGE_BUCKET = "client-files";

export interface AdminContentItem extends ContentItem {
  companies: { name: string } | null;
  visual: { id: string; file_name: string; storage_path: string; mime_type: string | null } | null;
}

export async function getAllContentItemsForAdmin(): Promise<AdminContentItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(
      "*, companies ( name ), visual:files!content_items_visual_file_id_fkey ( id, file_name, storage_path, mime_type )"
    )
    .order("scheduled_for", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Kon contentplanning niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminContentItem[];
}

export interface AdminContentItemWithThumbnail extends AdminContentItem {
  visualThumbnailUrl: string | null;
}

export async function withVisualThumbnailsAdmin(items: AdminContentItem[]): Promise<AdminContentItemWithThumbnail[]> {
  const supabase = createClient();
  return Promise.all(
    items.map(async (item) => {
      if (!item.visual || !item.visual.mime_type?.startsWith("image/")) {
        return { ...item, visualThumbnailUrl: null };
      }
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(item.visual.storage_path, 60 * 5);
      if (error) console.error("Kon thumbnail niet laden:", error);
      return { ...item, visualThumbnailUrl: data?.signedUrl ?? null };
    })
  );
}

export async function updateContentItemAdmin(
  id: string,
  input: {
    title?: string;
    caption?: string | null;
    channels?: ContentChannel[];
    scheduledFor?: string | null;
    status?: ContentStatus;
  }
): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.caption !== undefined) patch.caption = input.caption;
  if (input.channels !== undefined) patch.channels = input.channels;
  if (input.scheduledFor !== undefined) patch.scheduled_for = input.scheduledFor;
  if (input.status !== undefined) patch.status = input.status;

  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("content_items").update(patch).eq("id", id);
  if (error) throw new Error(`Kon content-item niet bijwerken: ${error.message}`);

  if (input.status === "pending_approval") {
    const { data: itemData } = await supabase.from("content_items").select("title, company_id").eq("id", id).single();
    const item = itemData as { title: string; company_id: string } | null;
    if (item) {
      const { data: clientProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", item.company_id)
        .in("role", ["client_admin", "client_member"]);
      await createNotifications(
        ((clientProfiles ?? []) as { id: string }[]).map((p) => ({
          recipientId: p.id,
          type: "approval" as const,
          title: "Nieuwe content wacht op je goedkeuring",
          body: item.title,
          linkPath: `/content-planning/${id}`,
        }))
      );
    }
  }
}

export async function deleteContentItemAdmin(id: string): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const { error } = await supabase.from("content_items").delete().eq("id", id);
  if (error) throw new Error(`Kon content-item niet verwijderen: ${error.message}`);
}

/**
 * Duplicates a content item as a new draft, unscheduled — the copy lands in
 * the calendar's "Nog niet ingepland" tray rather than on the same date, so
 * bulk-entering a month of similar posts becomes: duplicate N times, then
 * drag each copy onto its own day (reusing the existing drag-to-reschedule
 * flow instead of adding a second date-picking UI). The visual is not
 * copied along — a shared `visual_file_id` would mean editing/replacing the
 * visual on one item silently changes it on the other.
 */
export async function duplicateContentItemAdmin(id: string): Promise<void> {
  await assertTdvStaff();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: source, error: fetchError } = await supabase
    .from("content_items")
    .select("company_id, project_id, title, caption, channels")
    .eq("id", id)
    .single();
  if (fetchError || !source) throw new Error("Kon content-item niet vinden om te dupliceren.");

  const original = source as {
    company_id: string;
    project_id: string | null;
    title: string;
    caption: string | null;
    channels: ContentChannel[];
  };

  const { error: insertError } = await supabase.from("content_items").insert({
    company_id: original.company_id,
    project_id: original.project_id,
    title: `${original.title} (kopie)`,
    caption: original.caption,
    channels: original.channels,
    status: "draft",
    scheduled_for: null,
    created_by: user.id,
  });
  if (insertError) throw new Error(`Kon content-item niet dupliceren: ${insertError.message}`);
}

/**
 * Uploads a visual (image/video) for a content item and links it via
 * `visual_file_id`. Uses the RLS-bound client, not the admin client — the
 * caller runs as TDV staff, and `is_tdv_staff()` already grants storage and
 * `files` insert access for any company (see migration 0001), so there's no
 * "RLS can't do this" case here worth reaching for the service role over.
 */
export async function uploadContentItemVisual(contentItemId: string, file: File): Promise<void> {
  await assertTdvStaff();
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
