import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ContentItem } from "@/types/domain";

export interface AdminContentItem extends ContentItem {
  companies: { name: string } | null;
}

export async function getAllContentItemsForAdmin(): Promise<AdminContentItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("*, companies ( name )")
    .order("scheduled_for", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Kon contentplanning niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminContentItem[];
}
