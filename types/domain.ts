// Hand-written convenience types used across the app. Once db:types has run,
// these can mostly become `Database["public"]["Tables"]["x"]["Row"]` aliases —
// kept explicit here so the scaffold is readable without a live DB connection.
//
// Fields intentionally mirror Postgres column names (snake_case) rather than
// camelCase: lib/data/*.ts casts raw Supabase query results directly onto
// these types, so the shape here must match the actual runtime shape.

export type UserRole = "tdv_admin" | "tdv_staff" | "client_admin" | "client_member";

export interface Profile {
  id: string;
  company_id: string | null;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
}

export type ProjectStatus = "planning" | "in_progress" | "in_review" | "on_hold" | "completed";

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTimelineEvent {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  occurred_at: string;
  created_by: string | null;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "avatar_url"> | null;
}

export interface ProjectWithRelations extends Project {
  project_timeline_events: ProjectTimelineEvent[];
  project_comments: ProjectComment[];
  tickets: Pick<Ticket, "id" | "subject" | "status">[];
  files: Pick<FileRecord, "id" | "file_name" | "category" | "created_at">[];
}

export type ProjectRequestStatus = "requested" | "awaiting_quote" | "project_active" | "declined";
export type ProjectRequestPriceResponse = "pending" | "accepted" | "declined";

export interface ProjectRequest {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  status: ProjectRequestStatus;
  requested_by: string;
  indicative_price_range: string | null;
  indicative_price_note: string | null;
  price_response: ProjectRequestPriceResponse;
  created_at: string;
  updated_at: string;
}

export type TicketStatus = "new" | "in_progress" | "waiting_on_client" | "resolved";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Ticket {
  id: string;
  company_id: string;
  project_id: string | null;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at?: string;
  closed_at?: string | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "avatar_url"> | null;
}

export interface TicketWithMessages extends Ticket {
  ticket_messages: TicketMessage[];
}

export type FeedbackStatus = "pending" | "approved" | "revision_requested";

export interface FileRecord {
  id: string;
  company_id: string;
  project_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
}

export interface DeliverableVersion {
  id: string;
  deliverable_id: string;
  version_number: number;
  file_id: string | null;
  status: FeedbackStatus;
  created_at: string;
}

export interface DeliverableComment {
  id: string;
  deliverable_version_id: string;
  author_id: string;
  body: string;
  anchor_x: number | null;
  anchor_y: number | null;
  anchor_page: number | null;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "avatar_url"> | null;
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
  company_id: string;
  project_id: string | null;
  title: string;
  caption: string | null;
  channels: ContentChannel[];
  status: ContentStatus;
  scheduled_for: string | null;
  visual_file_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationType = "ticket" | "comment" | "approval" | "file" | "deadline";

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
}
