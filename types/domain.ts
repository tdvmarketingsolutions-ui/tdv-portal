// Hand-written convenience types used across the app. Once db:types has run,
// these can mostly become `Database["public"]["Tables"]["x"]["Row"]` aliases —
// kept explicit here so the scaffold is readable without a live DB connection.

export type UserRole = "tdv_admin" | "tdv_staff" | "client_admin" | "client_member";

export interface Profile {
  id: string;
  companyId: string | null;
  role: UserRole;
  fullName: string | null;
  avatarUrl: string | null;
}

export type ProjectStatus = "planning" | "in_progress" | "in_review" | "on_hold" | "completed";

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TicketStatus = "new" | "in_progress" | "waiting_on_client" | "resolved";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Ticket {
  id: string;
  companyId: string;
  projectId: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
}

export type ContentStatus = "draft" | "pending_approval" | "approved" | "scheduled" | "published";
export type ContentChannel =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "tiktok"
  | "blog"
  | "email"
  | "ads"
  | "other";

export interface ContentItem {
  id: string;
  companyId: string;
  title: string;
  caption: string | null;
  channel: ContentChannel;
  status: ContentStatus;
  scheduledFor: string | null;
  visualFileId: string | null;
}
