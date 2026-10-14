import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getStaffProfileIdsForAgency } from "@/lib/data/staff";
import { createNotifications } from "@/lib/data/notifications";
import { getDeadlineUrgency } from "@/lib/project-deadline";
import type { Project, ProjectStatus } from "@/types/domain";

const OVERDUE_RENOTIFY_DAYS = 7;

type ProjectForReminder = Pick<Project, "id" | "name" | "deadline" | "status" | "owner_id" | "company_id"> & {
  deadline_reminder_sent_at: string | null;
  companies: { name: string } | null;
};

/**
 * Runs daily via /api/cron/deadline-reminders (same CRON_SECRET bearer
 * pattern as the AI-ingest cron). Uses the admin client because this has no
 * signed-in session to scope RLS by — it has to look across every agency's
 * projects in one pass, same reasoning as ingestKnowledgeBaseAsCronJob.
 *
 * Two reminder moments per project: once when its deadline first enters the
 * "soon" window, and repeatingly (at most once a week) while it stays
 * overdue — so a missed deadline keeps nagging instead of going silent after
 * one email. deadline_reminder_sent_at (reset by a DB trigger whenever the
 * deadline itself moves, see migration 0030) is what prevents re-sending the
 * "soon" reminder on every run.
 */
export async function sendDeadlineRemindersAsCronJob(): Promise<{ reminded: number }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("id, name, deadline, status, owner_id, company_id, deadline_reminder_sent_at, companies ( name )")
    .not("deadline", "is", null)
    .neq("status", "completed");

  if (error) throw new Error(`Kon projecten voor deadline-herinneringen niet laden: ${error.message}`);

  const projects = (data ?? []) as unknown as ProjectForReminder[];
  const now = new Date();
  const toRemind = projects.filter((p) => shouldRemind(p, now));
  if (toRemind.length === 0) return { reminded: 0 };

  const notificationRows: { recipientId: string; type: "deadline"; title: string; body: string; linkPath: string }[] = [];

  for (const project of toRemind) {
    const urgency = getDeadlineUrgency(project.deadline, project.status as ProjectStatus);
    const recipientIds = project.owner_id
      ? [project.owner_id]
      : await getStaffProfileIdsForAgency(project.company_id);

    const title =
      urgency === "overdue" ? `Deadline verstreken: ${project.name}` : `Deadline binnenkort: ${project.name}`;
    const body =
      urgency === "overdue"
        ? `De deadline van "${project.name}"${project.companies?.name ? ` (${project.companies.name})` : ""} is verstreken.`
        : `De deadline van "${project.name}"${project.companies?.name ? ` (${project.companies.name})` : ""} is over maximaal ${3} dagen.`;

    for (const recipientId of recipientIds) {
      notificationRows.push({
        recipientId,
        type: "deadline",
        title,
        body,
        linkPath: `/projects/${project.id}`,
      });
    }
  }

  await createNotifications(notificationRows);

  const { error: updateError } = await admin
    .from("projects")
    .update({ deadline_reminder_sent_at: now.toISOString() })
    .in(
      "id",
      toRemind.map((p) => p.id)
    );
  if (updateError) throw new Error(`Kon deadline-herinneringen niet markeren als verstuurd: ${updateError.message}`);

  return { reminded: toRemind.length };
}

function shouldRemind(project: ProjectForReminder, now: Date): boolean {
  const urgency = getDeadlineUrgency(project.deadline, project.status as ProjectStatus);
  if (!urgency) return false;

  if (!project.deadline_reminder_sent_at) return true;
  if (urgency === "soon") return false; // already reminded once for this deadline

  const daysSinceLastReminder =
    (now.getTime() - new Date(project.deadline_reminder_sent_at).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceLastReminder >= OVERDUE_RENOTIFY_DAYS;
}
