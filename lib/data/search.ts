import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABEL } from "@/lib/project-status";
import { TICKET_STATUS_LABEL } from "@/lib/ticket-status";
import { CONTENT_STATUS_LABEL } from "@/lib/content-status";
import type { ProjectStatus, TicketStatus, ContentStatus } from "@/types/domain";

export type SearchResultType = "project" | "ticket" | "content_item" | "file";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const RESULTS_PER_TYPE = 5;

/**
 * One ILIKE query per source table, each scoped by RLS exactly like every
 * other read in lib/data — no company_id/agency_id filtering here, same
 * invariant as the rest of the app (see CLAUDE.md). Four sources chosen for
 * v1 as the ones people actually look a name/title up by; deliverables and
 * folders can follow the same pattern later if needed.
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const supabase = createClient();
  // Escape ILIKE wildcards in the user's own input so e.g. a literal "%" or
  // "_" in a search term doesn't act as a wildcard.
  const escaped = trimmed.replace(/[%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  const [projectsRes, ticketsRes, contentItemsRes, filesRes] = await Promise.all([
    supabase.from("projects").select("id, name, status").ilike("name", pattern).limit(RESULTS_PER_TYPE),
    supabase.from("tickets").select("id, subject, status").ilike("subject", pattern).limit(RESULTS_PER_TYPE),
    supabase.from("content_items").select("id, title, status").ilike("title", pattern).limit(RESULTS_PER_TYPE),
    supabase.from("files").select("id, file_name, folder_id").ilike("file_name", pattern).limit(RESULTS_PER_TYPE),
  ]);

  const results: SearchResult[] = [];

  for (const p of (projectsRes.data ?? []) as { id: string; name: string; status: ProjectStatus }[]) {
    results.push({
      type: "project",
      id: p.id,
      title: p.name,
      subtitle: `Project — ${PROJECT_STATUS_LABEL[p.status]}`,
      href: `/projects/${p.id}`,
    });
  }

  for (const t of (ticketsRes.data ?? []) as { id: string; subject: string; status: TicketStatus }[]) {
    results.push({
      type: "ticket",
      id: t.id,
      title: t.subject,
      subtitle: `Aanvraag — ${TICKET_STATUS_LABEL[t.status]}`,
      href: `/aanvragen/${t.id}`,
    });
  }

  for (const c of (contentItemsRes.data ?? []) as { id: string; title: string; status: ContentStatus }[]) {
    results.push({
      type: "content_item",
      id: c.id,
      title: c.title,
      subtitle: `Content — ${CONTENT_STATUS_LABEL[c.status]}`,
      href: `/content-planning/${c.id}`,
    });
  }

  for (const f of (filesRes.data ?? []) as { id: string; file_name: string; folder_id: string | null }[]) {
    results.push({
      type: "file",
      id: f.id,
      title: f.file_name,
      subtitle: "Bestand",
      href: f.folder_id ? `/files/${f.folder_id}` : "/files",
    });
  }

  return results;
}
