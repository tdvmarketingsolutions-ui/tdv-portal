import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/data/admin/users";
import { sendEmail, absoluteUrl } from "@/lib/email/send";
import type { Notification, NotificationType } from "@/types/domain";

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

/**
 * `notifications` has no INSERT policy for anyone (see migration 0001) —
 * same reasoning as `ai_documents`: nobody should be able to fabricate a
 * notification for another user, so the only writer is this trusted
 * server-side path using the admin client.
 *
 * Best-effort by design: creating a notification is always a side effect of
 * some other action (posting a ticket reply, submitting content for
 * approval) — a failure here must never fail that primary action, so this
 * swallows its own errors instead of throwing.
 */
export async function createNotifications(
  rows: { recipientId: string; type: NotificationType; title: string; body?: string; linkPath?: string }[]
): Promise<void> {
  if (rows.length === 0 || !isServiceRoleConfigured()) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(
      rows.map((r) => ({
        recipient_id: r.recipientId,
        type: r.type,
        title: r.title,
        body: r.body ?? null,
        link_path: r.linkPath ?? null,
      }))
    );
    if (error) {
      console.error("Kon melding(en) niet aanmaken:", error.message);
      return;
    }

    await emailRecipients(admin, rows);
  } catch (err) {
    console.error("Kon melding(en) niet aanmaken:", err);
  }
}

/**
 * Separate from the notification insert above so an email failure never
 * rolls back or blocks the in-app notification, which is the part that
 * actually has to exist. Only mails recipients who haven't opted out
 * (profiles.email_notifications, migration 0014) and skips entirely if
 * EMAIL_PROVIDER_API_KEY isn't configured (sendEmail no-ops either way, but
 * checking here avoids the extra auth.admin lookups for nothing).
 */
async function emailRecipients(
  admin: ReturnType<typeof createAdminClient>,
  rows: { recipientId: string; type: NotificationType; title: string; body?: string; linkPath?: string }[]
): Promise<void> {
  if (!process.env.EMAIL_PROVIDER_API_KEY) return;

  const recipientIds = [...new Set(rows.map((r) => r.recipientId))];
  const { data: prefsData } = await admin
    .from("profiles")
    .select("id, email_notifications")
    .in("id", recipientIds);
  const prefs = (prefsData ?? []) as unknown as { id: string; email_notifications: boolean }[];
  const optedIn = new Set(prefs.filter((p) => p.email_notifications).map((p) => p.id));

  for (const row of rows) {
    if (!optedIn.has(row.recipientId)) continue;

    const { data: userData } = await admin.auth.admin.getUserById(row.recipientId);
    const email = userData.user?.email;
    if (!email) continue;

    const link = row.linkPath ? absoluteUrl(row.linkPath) : absoluteUrl("/dashboard");
    await sendEmail({
      to: email,
      subject: row.title,
      html: `<p>${row.body ?? row.title}</p><p><a href="${link}">Bekijk in het portaal</a></p>`,
    });
  }
}
