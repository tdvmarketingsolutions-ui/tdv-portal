import type { ProjectRequestStatus } from "@/types/domain";
import type { BadgeTone } from "@/components/ui/Badge";

export const PROJECT_REQUEST_STATUS_LABEL: Record<ProjectRequestStatus, string> = {
  requested: "Aangevraagd",
  awaiting_quote: "Wacht op offerte",
  project_active: "Project actief",
  declined: "Geweigerd",
};

export const PROJECT_REQUEST_STATUS_TONE: Record<ProjectRequestStatus, BadgeTone> = {
  requested: "blue",
  awaiting_quote: "amber",
  project_active: "green",
  declined: "red",
};
