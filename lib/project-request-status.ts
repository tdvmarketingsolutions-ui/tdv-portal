import type { ProjectRequestStatus, ProjectRequestType, BudgetIndication } from "@/types/domain";
import type { BadgeTone } from "@/components/ui/Badge";

export const PROJECT_REQUEST_STATUS_LABEL: Record<ProjectRequestStatus, string> = {
  requested: "Aangevraagd",
  awaiting_quote: "Wordt opgestart",
  project_active: "Project actief",
  declined: "Geweigerd",
};

export const PROJECT_REQUEST_STATUS_TONE: Record<ProjectRequestStatus, BadgeTone> = {
  requested: "blue",
  awaiting_quote: "amber",
  project_active: "green",
  declined: "red",
};

export const PROJECT_REQUEST_TYPE_LABEL: Record<ProjectRequestType, string> = {
  website: "Website",
  branding: "Branding / huisstijl",
  social_media: "Social media",
  seo_sea: "SEO / advertenties",
  video: "Video",
  other: "Iets anders",
};

export const BUDGET_INDICATION_LABEL: Record<BudgetIndication, string> = {
  under_1000: "Minder dan €1.000",
  from_1000_to_3000: "€1.000 – €3.000",
  from_3000_to_7000: "€3.000 – €7.000",
  over_7000: "Meer dan €7.000",
  unknown: "Nog geen idee",
};
