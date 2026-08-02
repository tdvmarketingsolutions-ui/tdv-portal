import { Ticket, MessageSquareText, CheckCircle2, FileStack, CalendarClock, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/types/domain";

export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  ticket: Ticket,
  comment: MessageSquareText,
  approval: CheckCircle2,
  file: FileStack,
  deadline: CalendarClock,
};
