import type { ProjectStatus } from "@/types/domain";
import type { BadgeTone } from "@/components/ui/Badge";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In uitvoering",
  in_review: "In review",
  on_hold: "On hold",
  completed: "Afgerond",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, BadgeTone> = {
  planning: "gray",
  in_progress: "blue",
  in_review: "amber",
  on_hold: "violet",
  completed: "green",
};
