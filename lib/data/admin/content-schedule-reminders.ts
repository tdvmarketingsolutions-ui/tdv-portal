import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getStaffProfileIdsForAgency } from "@/lib/data/staff";
import { createNotifications } from "@/lib/data/notifications";
import { isContentOverdue } from "@/lib/content-schedule";
import type { ContentItem } from "@/types/domain";

type ContentForReminder = Pick<ContentItem, "id" | "title" | "scheduled_for" | "status" | "created_by" | "company_id"> & {
  schedule_reminder_sent_at: string | null;
  companies: { name: string } | null;
};

/**
 * Runs daily via /api/cron/content-schedule-check (same CRON_SECRET bearer
 * pattern as the other crons). One reminder per content item the moment its
 * scheduled_for passes while still 'scheduled' — schedule_reminder_sent_at
 * (reset by a DB trigger whenever scheduled_for or status changes, see
 * migration 0031) keeps this from re-notifying on every run.
 */
export async function sendContentScheduleRemindersAsCronJob(): Promise<{ reminded: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("content_items")
    .select("id, title, scheduled_for, status, created_by, company_id, schedule_reminder_sent_at, companies ( name )")
    .eq("status", "scheduled")
    .is("schedule_reminder_sent_at", null)
    .not("scheduled_for", "is", null);

  if (error) throw new Error(`Kon content voor planningsherinneringen niet laden: ${error.message}`);

  const items = (data ?? []) as unknown as ContentForReminder[];
  const toRemind = items.filter((c) => isContentOverdue(c.scheduled_for, c.status));
  if (toRemind.length === 0) return { reminded: 0 };

  const notificationRows: { recipientId: string; type: "deadline"; title: string; body: string; linkPath: string }[] = [];

  for (const item of toRemind) {
    const recipientIds = item.created_by ? [item.created_by] : await getStaffProfileIdsForAgency(item.company_id);
    for (const recipientId of recipientIds) {
      notificationRows.push({
        recipientId,
        type: "deadline",
        title: `Nog niet gepubliceerd: ${item.title}`,
        body: `"${item.title}"${item.companies?.name ? ` (${item.companies.name})` : ""} stond gepland maar staat nog op "Ingepland" — check of het al is gepost.`,
        linkPath: `/content-planning/${item.id}`,
      });
    }
  }

  await createNotifications(notificationRows);

  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from("content_items")
    .update({ schedule_reminder_sent_at: now })
    .in(
      "id",
      toRemind.map((c) => c.id)
    );
  if (updateError) throw new Error(`Kon planningsherinneringen niet markeren als verstuurd: ${updateError.message}`);

  return { reminded: toRemind.length };
}
