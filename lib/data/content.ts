import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentChannel, ContentItem, ContentStatus } from "@/types/domain";

export interface ContentVisual {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
}

export interface ContentItemWithComments extends ContentItem {
  visual: ContentVisual | null;
  content_item_comments: {
    id: string;
    content_item_id: string;
    author_id: string;
    body: string;
    created_at: string;
    profiles?: { full_name: string | null; avatar_url: string | null } | null;
  }[];
}

export async function getContentItemsForCurrentUser(): Promise<ContentItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .order("scheduled_for", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Kon contentplanning niet laden: ${error.message}`);
  return (data ?? []) as unknown as ContentItem[];
}

export async function getContentItemById(id: string): Promise<ContentItemWithComments | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select(
      `*, visual:files!content_items_visual_file_id_fkey ( id, storage_path, file_name, mime_type ), content_item_comments (*, profiles ( full_name, avatar_url ))`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Kon contentitem niet laden: ${error.message}`);
  return data as unknown as ContentItemWithComments | null;
}

export async function createContentItem(input: {
  companyId: string;
  title: string;
  caption?: string;
  channel: ContentChannel;
  scheduledFor?: string;
  projectId?: string;
}): Promise<ContentItem> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      company_id: input.companyId,
      project_id: input.projectId ?? null,
      title: input.title,
      caption: input.caption ?? null,
      channel: input.channel,
      scheduled_for: input.scheduledFor ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Kon content-item niet aanmaken: ${error.message}`);
  return data as unknown as ContentItem;
}

/**
 * Client-facing create: no companyId parameter, unlike createContentItem
 * above (which admin uses to create for a client it explicitly picked).
 * Resolves company_id from the caller's own profile, same pattern as
 * createTicket in lib/data/tickets.ts — matches migration 0012's
 * content_items_insert_client policy, which only allows a client to insert
 * a row for their own company_id.
 */
export async function createContentItemForCurrentUser(input: {
  title: string;
  caption?: string;
  channel: ContentChannel;
  scheduledFor?: string;
}): Promise<ContentItem> {
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

  const { data, error } = await supabase
    .from("content_items")
    .insert({
      company_id: profile.company_id,
      title: input.title,
      caption: input.caption ?? null,
      channel: input.channel,
      scheduled_for: input.scheduledFor ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(`Kon content-item niet aanmaken: ${error.message}`);
  return data as unknown as ContentItem;
}

export async function updateContentItemStatus(id: string, status: ContentStatus): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("content_items").update({ status }).eq("id", id);
  if (error) throw new Error(`Kon status niet bijwerken: ${error.message}`);
}

export async function addContentItemComment(contentItemId: string, body: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase
    .from("content_item_comments")
    .insert({ content_item_id: contentItemId, author_id: user.id, body });

  if (error) throw new Error(`Kon opmerking niet plaatsen: ${error.message}`);
}
