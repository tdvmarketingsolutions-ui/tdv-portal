import type { ProjectStatus } from "@/types/domain";

export type DeadlineUrgency = "overdue" | "soon" | null;

const SOON_WINDOW_DAYS = 3;

/**
 * A completed project's deadline is history, not a risk — never flagged
 * regardless of the date. "soon" covers today through SOON_WINDOW_DAYS out;
 * anything already past is "overdue". Pure date math on the date-only
 * `deadline` column, no timezone-of-day subtleties to worry about.
 */
export function getDeadlineUrgency(deadline: string | null, status: ProjectStatus): DeadlineUrgency {
  if (!deadline || status === "completed") return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= SOON_WINDOW_DAYS) return "soon";
  return null;
}

export const DEADLINE_URGENCY_LABEL: Record<Exclude<DeadlineUrgency, null>, string> = {
  overdue: "Achterstallig",
  soon: "Binnenkort",
};
