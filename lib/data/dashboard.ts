import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AttentionItem {
  id: string;
  label: string;
  meta: string;
  href: string;
}

export interface ActivityItem {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  contextLabel: string;
  href: string;
}

export interface DashboardData {
  isStaff: boolean;
  projectCount: number;
  openTicketCount: number;
  unreadNotificationCount: number;
  attentionItems: AttentionItem[];
  activityItems: ActivityItem[];
}

/**
 * Single query bundle for the dashboard's "needs attention" + "recent
 * activity" sections. Reads straight from the existing tables (no
 * activity_log writer exists anywhere in the app yet, despite the table
 * being in the schema) — four small comment-table queries get merged and
 * sorted in application code rather than reaching for a SQL view/RPC, since
 * this is read-only and the volume here is small.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = profile?.role === "tdv_admin" || profile?.role === "tdv_staff";

  const [
    projectsRes,
    ticketsRes,
    notifCountRes,
    pendingContentRes,
    pendingDeliverableRes,
    waitingTicketsRes,
    staffOpenTicketsRes,
    staffApprovedContentRes,
    staffNewProjectRequestsRes,
    projectCommentsRes,
    ticketMessagesRes,
    deliverableCommentsRes,
    contentCommentsRes,
  ] = await Promise.all([
    supabase.from("projects").select("id"),
    supabase.from("tickets").select("id, status"),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).is("read_at", null),
    // Client-relevant: things waiting on the client to act.
    isStaff
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("content_items").select("id, title, channels").eq("status", "pending_approval"),
    isStaff
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("deliverable_versions")
          .select("id, version_number, deliverables ( id, title )")
          .eq("status", "pending"),
    isStaff
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("tickets").select("id, subject").eq("status", "waiting_on_client"),
    // Staff-relevant: things waiting on TDV to act.
    isStaff
      ? supabase.from("tickets").select("id, subject, status, companies ( name )").in("status", ["new", "in_progress"])
      : Promise.resolve({ data: [], error: null }),
    isStaff
      ? supabase.from("content_items").select("id, title, companies ( name )").eq("status", "approved")
      : Promise.resolve({ data: [], error: null }),
    isStaff
      ? supabase.from("project_requests").select("id, title, companies ( name )").eq("status", "requested")
      : Promise.resolve({ data: [], error: null }),
    // Recent activity feed — same four sources for everyone, RLS already
    // scopes each to what the caller may see.
    supabase
      .from("project_comments")
      .select("id, body, created_at, project_id, profiles ( full_name ), projects ( name )")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("ticket_messages")
      .select("id, body, created_at, ticket_id, profiles ( full_name ), tickets ( subject )")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("deliverable_comments")
      .select(
        "id, body, created_at, deliverable_version_id, profiles ( full_name ), deliverable_versions ( deliverable_id, deliverables ( id, title ) )"
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("content_item_comments")
      .select("id, body, created_at, content_item_id, profiles ( full_name ), content_items ( title )")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const projects = (projectsRes.data ?? []) as unknown as { id: string }[];
  const tickets = (ticketsRes.data ?? []) as unknown as { id: string; status: string }[];
  const openTicketCount = tickets.filter((t) => t.status !== "resolved").length;

  const attentionItems: AttentionItem[] = [];

  for (const item of (pendingContentRes.data ?? []) as unknown as { id: string; title: string; channels: string[] }[]) {
    attentionItems.push({
      id: `content-${item.id}`,
      label: item.title,
      meta: `Goedkeuring nodig — ${item.channels.join(", ")}`,
      href: `/content-planning/${item.id}`,
    });
  }
  for (const v of (pendingDeliverableRes.data ?? []) as unknown as {
    id: string;
    version_number: number;
    deliverables: { id: string; title: string } | null;
  }[]) {
    if (!v.deliverables) continue;
    attentionItems.push({
      id: `deliverable-${v.id}`,
      label: v.deliverables.title,
      meta: `Feedback nodig — versie ${v.version_number}`,
      href: `/feedback/${v.deliverables.id}`,
    });
  }
  for (const t of (waitingTicketsRes.data ?? []) as unknown as { id: string; subject: string }[]) {
    attentionItems.push({
      id: `ticket-${t.id}`,
      label: t.subject,
      meta: "Wacht op jouw antwoord",
      href: `/aanvragen/${t.id}`,
    });
  }
  for (const t of (staffOpenTicketsRes.data ?? []) as unknown as {
    id: string;
    subject: string;
    status: string;
    companies: { name: string } | null;
  }[]) {
    attentionItems.push({
      id: `staff-ticket-${t.id}`,
      label: t.subject,
      meta: `${t.status === "new" ? "Nieuwe aanvraag" : "In behandeling"}${t.companies?.name ? ` — ${t.companies.name}` : ""}`,
      href: `/aanvragen/${t.id}`,
    });
  }
  for (const c of (staffApprovedContentRes.data ?? []) as unknown as {
    id: string;
    title: string;
    companies: { name: string } | null;
  }[]) {
    attentionItems.push({
      id: `staff-content-${c.id}`,
      label: c.title,
      meta: `Klaar om in te plannen${c.companies?.name ? ` — ${c.companies.name}` : ""}`,
      href: `/content-planning/${c.id}`,
    });
  }
  for (const r of (staffNewProjectRequestsRes.data ?? []) as unknown as {
    id: string;
    title: string;
    companies: { name: string } | null;
  }[]) {
    attentionItems.push({
      id: `staff-project-request-${r.id}`,
      label: r.title,
      meta: `Nieuwe projectaanvraag${r.companies?.name ? ` — ${r.companies.name}` : ""}`,
      href: "/admin/projects",
    });
  }

  const activityItems: ActivityItem[] = [];

  for (const c of (projectCommentsRes.data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    project_id: string;
    profiles: { full_name: string | null } | null;
    projects: { name: string } | null;
  }[]) {
    activityItems.push({
      id: `pc-${c.id}`,
      body: c.body,
      authorName: c.profiles?.full_name ?? "Onbekend",
      createdAt: c.created_at,
      contextLabel: `Project — ${c.projects?.name ?? "onbekend"}`,
      href: `/projects/${c.project_id}`,
    });
  }
  for (const m of (ticketMessagesRes.data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    ticket_id: string;
    profiles: { full_name: string | null } | null;
    tickets: { subject: string } | null;
  }[]) {
    activityItems.push({
      id: `tm-${m.id}`,
      body: m.body,
      authorName: m.profiles?.full_name ?? "Onbekend",
      createdAt: m.created_at,
      contextLabel: `Aanvraag — ${m.tickets?.subject ?? "onbekend"}`,
      href: `/aanvragen/${m.ticket_id}`,
    });
  }
  for (const c of (deliverableCommentsRes.data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    profiles: { full_name: string | null } | null;
    deliverable_versions: { deliverable_id: string; deliverables: { id: string; title: string } | null } | null;
  }[]) {
    const deliverable = c.deliverable_versions?.deliverables;
    if (!deliverable) continue;
    activityItems.push({
      id: `dc-${c.id}`,
      body: c.body,
      authorName: c.profiles?.full_name ?? "Onbekend",
      createdAt: c.created_at,
      contextLabel: `Feedback — ${deliverable.title}`,
      href: `/feedback/${deliverable.id}`,
    });
  }
  for (const c of (contentCommentsRes.data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    content_item_id: string;
    profiles: { full_name: string | null } | null;
    content_items: { title: string } | null;
  }[]) {
    activityItems.push({
      id: `cc-${c.id}`,
      body: c.body,
      authorName: c.profiles?.full_name ?? "Onbekend",
      createdAt: c.created_at,
      contextLabel: `Content — ${c.content_items?.title ?? "onbekend"}`,
      href: `/content-planning/${c.content_item_id}`,
    });
  }

  activityItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    isStaff,
    projectCount: projects.length,
    openTicketCount,
    unreadNotificationCount: notifCountRes.count ?? 0,
    attentionItems,
    activityItems: activityItems.slice(0, 8),
  };
}
