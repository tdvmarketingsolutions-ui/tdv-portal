import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types/domain";

export async function getNotificationsForCurrentUser(): Promise<Notification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon meldingen niet laden: ${error.message}`);
  return (data ?? []) as unknown as Notification[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) throw new Error(`Kon ongelezen meldingen niet tellen: ${error.message}`);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Kon melding niet markeren als gelezen: ${error.message}`);
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) throw new Error(`Kon meldingen niet markeren als gelezen: ${error.message}`);
}
