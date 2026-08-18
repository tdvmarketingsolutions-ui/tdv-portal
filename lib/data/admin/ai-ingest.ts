import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { embedTexts } from "@/lib/ai/embeddings";
import { isServiceRoleConfigured } from "@/lib/data/admin/users";
import { assertTdvStaff } from "@/lib/auth/assert-staff";

/**
 * Knowledge-base ingest pipeline for the AI assistant's RAG retrieval.
 *
 * Turns projects, tickets, deliverables (feedback) and content planning into
 * short text chunks, embeds them, and writes them to `ai_documents`. There is
 * no `invoices` table in this schema (despite older docs mentioning one), so
 * those four modules are the real source set.
 *
 * Full resync on every run: all `ai_documents` rows for these source types
 * are deleted and rebuilt from scratch. That avoids needing an upsert key
 * per source row and guarantees edits/deletes in the source data are
 * reflected — the tradeoff is that a run re-embeds everything rather than
 * only what changed, which is fine at this scaffold's data volume but would
 * need incremental diffing (e.g. an `updated_at` watermark) at real scale.
 *
 * `ai_documents` has no INSERT/DELETE policy for anyone (see migration
 * 0001), by design — the only writer is this trusted server-side path,
 * which is why it needs both clients: the RLS-bound client to read (a TDV
 * staff session already sees every company via `is_tdv_staff()`), and the
 * admin client to write. Callers MUST verify the caller is TDV staff before
 * invoking this — it does its own belt-and-suspenders check below, but the
 * calling route/action is the primary gate (see CLAUDE.md's admin
 * double-check pattern).
 */

const INGESTED_SOURCE_TYPES = ["project", "ticket", "deliverable", "content_item"] as const;
type IngestedSourceType = (typeof INGESTED_SOURCE_TYPES)[number];

const MAX_CHUNK_CHARS = 4000;
const EMBED_BATCH_SIZE = 64;

interface Chunk {
  companyId: string;
  sourceType: IngestedSourceType;
  sourceId: string;
  content: string;
}

export interface IngestResult {
  chunksWritten: number;
  companiesTouched: number;
}

function truncate(text: string): string {
  return text.length > MAX_CHUNK_CHARS ? `${text.slice(0, MAX_CHUNK_CHARS)}…` : text;
}

function push(chunks: Chunk[], companyId: string | null | undefined, sourceType: IngestedSourceType, sourceId: string, content: string) {
  if (!companyId) return; // shouldn't happen for these tables, but never write an orphaned chunk
  const trimmed = content.trim();
  if (!trimmed) return;
  chunks.push({ companyId, sourceType, sourceId, content: truncate(trimmed) });
}

interface ProjectRow {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  status: string;
  deadline: string | null;
  companies: { name: string } | null;
  project_comments: { body: string }[];
  project_timeline_events: { title: string; description: string | null; occurred_at: string }[];
}

interface TicketRow {
  id: string;
  company_id: string;
  subject: string;
  status: string;
  priority: string;
  companies: { name: string } | null;
  ticket_messages: { body: string }[];
}

interface DeliverableRow {
  id: string;
  title: string;
  projects: { company_id: string; name: string } | null;
  deliverable_versions: {
    version_number: number;
    status: string;
    deliverable_comments: { body: string }[];
  }[];
}

interface ContentItemRow {
  id: string;
  company_id: string;
  title: string;
  caption: string | null;
  channel: string;
  status: string;
  scheduled_for: string | null;
  companies: { name: string } | null;
  content_item_comments: { body: string }[];
}

function buildChunks(data: {
  projects: ProjectRow[];
  tickets: TicketRow[];
  deliverables: DeliverableRow[];
  contentItems: ContentItemRow[];
}): Chunk[] {
  const chunks: Chunk[] = [];

  for (const project of data.projects) {
    const companyName = project.companies?.name ?? "onbekende klant";
    push(
      chunks,
      project.company_id,
      "project",
      project.id,
      `Project "${project.name}" (klant: ${companyName}) — status: ${project.status}, deadline: ${
        project.deadline ?? "geen"
      }.\n${project.description ?? ""}`
    );
    for (const comment of project.project_comments) {
      push(chunks, project.company_id, "project", project.id, `Opmerking bij project "${project.name}": ${comment.body}`);
    }
    for (const event of project.project_timeline_events) {
      push(
        chunks,
        project.company_id,
        "project",
        project.id,
        `Tijdlijn — project "${project.name}", ${event.occurred_at}: ${event.title}. ${event.description ?? ""}`
      );
    }
  }

  for (const ticket of data.tickets) {
    const companyName = ticket.companies?.name ?? "onbekende klant";
    push(
      chunks,
      ticket.company_id,
      "ticket",
      ticket.id,
      `Aanvraag "${ticket.subject}" (klant: ${companyName}) — status: ${ticket.status}, prioriteit: ${ticket.priority}.`
    );
    for (const message of ticket.ticket_messages) {
      push(chunks, ticket.company_id, "ticket", ticket.id, `Bericht bij aanvraag "${ticket.subject}": ${message.body}`);
    }
  }

  for (const deliverable of data.deliverables) {
    const companyId = deliverable.projects?.company_id;
    const projectName = deliverable.projects?.name ?? "onbekend project";
    push(
      chunks,
      companyId,
      "deliverable",
      deliverable.id,
      `Deliverable "${deliverable.title}" bij project "${projectName}".`
    );
    for (const version of deliverable.deliverable_versions) {
      push(
        chunks,
        companyId,
        "deliverable",
        deliverable.id,
        `Deliverable "${deliverable.title}", versie ${version.version_number} — status: ${version.status}.`
      );
      for (const comment of version.deliverable_comments) {
        push(
          chunks,
          companyId,
          "deliverable",
          deliverable.id,
          `Feedback op deliverable "${deliverable.title}" (versie ${version.version_number}): ${comment.body}`
        );
      }
    }
  }

  for (const item of data.contentItems) {
    const companyName = item.companies?.name ?? "onbekende klant";
    push(
      chunks,
      item.company_id,
      "content_item",
      item.id,
      `Contentitem "${item.title}" (klant: ${companyName}, kanaal: ${item.channel}) — status: ${item.status}, gepland: ${
        item.scheduled_for ?? "niet gepland"
      }.\n${item.caption ?? ""}`
    );
    for (const comment of item.content_item_comments) {
      push(chunks, item.company_id, "content_item", item.id, `Opmerking bij contentitem "${item.title}": ${comment.body}`);
    }
  }

  return chunks;
}

export async function ingestKnowledgeBase(): Promise<IngestResult> {
  await assertTdvStaff();

  if (!isServiceRoleConfigured()) {
    throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  }

  const supabase = createClient(); // staff session — RLS grants cross-company read
  const admin = createAdminClient(); // ai_documents has no write policy for anyone

  const [projectsRes, ticketsRes, deliverablesRes, contentItemsRes] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "id, company_id, name, description, status, deadline, companies ( name ), project_comments ( body ), project_timeline_events ( title, description, occurred_at )"
      ),
    supabase
      .from("tickets")
      .select("id, company_id, subject, status, priority, companies ( name ), ticket_messages ( body )"),
    supabase
      .from("deliverables")
      .select(
        "id, title, projects ( company_id, name ), deliverable_versions ( version_number, status, deliverable_comments ( body ) )"
      ),
    supabase
      .from("content_items")
      .select(
        "id, company_id, title, caption, channel, status, scheduled_for, companies ( name ), content_item_comments ( body )"
      ),
  ]);

  if (projectsRes.error) throw new Error(`Kon projecten niet laden voor ingest: ${projectsRes.error.message}`);
  if (ticketsRes.error) throw new Error(`Kon tickets niet laden voor ingest: ${ticketsRes.error.message}`);
  if (deliverablesRes.error) throw new Error(`Kon deliverables niet laden voor ingest: ${deliverablesRes.error.message}`);
  if (contentItemsRes.error) throw new Error(`Kon contentplanning niet laden voor ingest: ${contentItemsRes.error.message}`);

  const chunks = buildChunks({
    projects: (projectsRes.data ?? []) as unknown as ProjectRow[],
    tickets: (ticketsRes.data ?? []) as unknown as TicketRow[],
    deliverables: (deliverablesRes.data ?? []) as unknown as DeliverableRow[],
    contentItems: (contentItemsRes.data ?? []) as unknown as ContentItemRow[],
  });

  const companiesTouched = new Set(chunks.map((c) => c.companyId));

  // Embed everything before touching the table: if the provider fails
  // partway through, the existing knowledge base is left untouched rather
  // than deleted-and-not-rebuilt.
  const rows: { company_id: string; source_type: IngestedSourceType; source_id: string; content: string; embedding: number[] }[] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedTexts(batch.map((c) => c.content));
    if (embeddings.length !== batch.length) {
      throw new Error("Embeddings provider returned a different number of embeddings than requested.");
    }
    batch.forEach((c, idx) => {
      rows.push({ company_id: c.companyId, source_type: c.sourceType, source_id: c.sourceId, content: c.content, embedding: embeddings[idx]! });
    });
  }

  const { error: deleteError } = await admin.from("ai_documents").delete().in("source_type", INGESTED_SOURCE_TYPES);
  if (deleteError) throw new Error(`Kon oude kennisbank-fragmenten niet verwijderen: ${deleteError.message}`);

  let written = 0;
  for (let i = 0; i < rows.length; i += EMBED_BATCH_SIZE) {
    const batch = rows.slice(i, i + EMBED_BATCH_SIZE);
    const { error: insertError } = await admin.from("ai_documents").insert(batch);
    if (insertError) throw new Error(`Kon kennisbank-fragmenten niet opslaan: ${insertError.message}`);
    written += batch.length;
  }

  return { chunksWritten: written, companiesTouched: companiesTouched.size };
}
