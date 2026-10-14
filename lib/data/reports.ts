import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveListFilterCompanyId } from "@/lib/staff-view";
import type { ContentChannel } from "@/types/domain";

const PERIOD_DAYS = 30;

export interface MonthlyReport {
  periodStart: string;
  periodEnd: string;
  contentPublishedCount: number;
  recentPublishedContent: { id: string; title: string; channels: ContentChannel[]; scheduledFor: string | null }[];
  ticketsResolvedCount: number;
  deliverablesApprovedCount: number;
  projectsCompletedCount: number;
}

/**
 * "Wat heeft TDV deze maand voor je gedaan" — every other page in the
 * portal answers "what needs attention right now"; nothing answered "what
 * actually got done." Pure read, same RLS-scoped client and no companyId
 * parameter as every other lib/data file — for a client this scopes to
 * their own company, for staff not viewing as a specific client it
 * naturally rolls up across their whole agency.
 */
export async function getMonthlyReportForCurrentUser(): Promise<MonthlyReport> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };
  // Same optional narrowing as every other list query in this app: a
  // client's own data is already all RLS returns, this only matters for
  // staff who picked a company via "Bekijk als klant" (lib/staff-view.ts).
  const viewCompanyId = resolveListFilterCompanyId(profile);

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const cutoffIso = periodStart.toISOString();

  let contentQuery = supabase
    .from("content_items")
    .select("id, title, channels, scheduled_for")
    .eq("status", "published")
    .gte("scheduled_for", cutoffIso)
    .order("scheduled_for", { ascending: false });
  let ticketsQuery = supabase.from("tickets").select("id").eq("status", "resolved").gte("closed_at", cutoffIso);
  let deliverablesQuery = supabase
    .from("deliverable_versions")
    .select("id, deliverables ( projects ( company_id ) )")
    .eq("status", "approved")
    .gte("created_at", cutoffIso);
  let projectsQuery = supabase.from("projects").select("id").eq("status", "completed").gte("updated_at", cutoffIso);

  if (viewCompanyId) {
    contentQuery = contentQuery.eq("company_id", viewCompanyId);
    ticketsQuery = ticketsQuery.eq("company_id", viewCompanyId);
    projectsQuery = projectsQuery.eq("company_id", viewCompanyId);
  }

  const [publishedContentRes, resolvedTicketsRes, approvedDeliverablesRes, completedProjectsRes] = await Promise.all([
    contentQuery,
    ticketsQuery,
    deliverablesQuery,
    projectsQuery,
  ]);

  const publishedContent = (publishedContentRes.data ?? []) as unknown as {
    id: string;
    title: string;
    channels: ContentChannel[];
    scheduled_for: string | null;
  }[];
  const approvedDeliverables = (approvedDeliverablesRes.data ?? []) as unknown as {
    id: string;
    deliverables: { projects: { company_id: string } | null } | null;
  }[];
  const deliverablesApprovedCount = viewCompanyId
    ? approvedDeliverables.filter((d) => d.deliverables?.projects?.company_id === viewCompanyId).length
    : approvedDeliverables.length;

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    contentPublishedCount: publishedContent.length,
    recentPublishedContent: publishedContent.slice(0, 5).map((c) => ({
      id: c.id,
      title: c.title,
      channels: c.channels,
      scheduledFor: c.scheduled_for,
    })),
    ticketsResolvedCount: (resolvedTicketsRes.data ?? []).length,
    deliverablesApprovedCount,
    projectsCompletedCount: (completedProjectsRes.data ?? []).length,
  };
}
