import type { TicketPriority, TicketStatus } from "@/types/domain";
import type { BadgeTone } from "@/components/ui/Badge";

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  new: "Nieuw",
  in_progress: "In behandeling",
  waiting_on_client: "Wachten op klant",
  resolved: "Afgerond",
};

export const TICKET_STATUS_TONE: Record<TicketStatus, BadgeTone> = {
  new: "new",
  in_progress: "progress",
  waiting_on_client: "waiting",
  resolved: "done",
};

export const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Laag",
  normal: "Normaal",
  high: "Hoog",
  urgent: "Urgent",
};

export const TICKET_PRIORITY_TONE: Record<TicketPriority, BadgeTone> = {
  low: "neutral",
  normal: "new",
  high: "waiting",
  urgent: "danger",
};
