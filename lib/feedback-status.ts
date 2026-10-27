import type { FeedbackStatus } from "@/types/domain";
import type { BadgeTone } from "@/components/ui/Badge";

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  pending: "Wacht op feedback",
  approved: "Goedgekeurd",
  revision_requested: "Revisie gevraagd",
};

export const FEEDBACK_STATUS_TONE: Record<FeedbackStatus, BadgeTone> = {
  pending: "waiting",
  approved: "done",
  revision_requested: "danger",
};
