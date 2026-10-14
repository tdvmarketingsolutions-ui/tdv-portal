import type { ContentStatus } from "@/types/domain";

/**
 * Nothing auto-publishes content (the Meta/Instagram publishing integration
 * doesn't exist yet — see CLAUDE.md), so "scheduled" always means a human
 * still has to post it and come back to flip the status. If that scheduled
 * moment has already passed and nobody did, that's a real miss worth
 * flagging rather than letting it sit silently forever.
 */
export function isContentOverdue(scheduledFor: string | null, status: ContentStatus): boolean {
  if (!scheduledFor || status !== "scheduled") return false;
  return new Date(scheduledFor).getTime() < Date.now();
}
