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
 * Incremental by default: the watermark is simply the newest
 * `ai_documents.created_at` from the previous run (no separate state table
 * needed — a row's created_at only moves forward when it's rewritten, so
 * the max is always "the last time anything was successfully synced").
 * Each run only re-embeds sources that changed since that watermark —
 * detected via each source's own `updated_at` plus its child comment/
 * version tables' `created_at` (a new comment doesn't bump its parent's
 * `updated_at`, so both have to be checked). A changed source has ALL of
 * its chunks deleted and rebuilt, not diffed chunk-by-chunk — simpler, and
 * correct, since one source's chunks are cheap to regenerate together.
 *
 * Known gap: `deliverable_versions.status` (approve/revision, migration
 * 0001) can change without any new row and has no `updated_at` column, so
 * a status-only edit isn't picked up incrementally. Call
 * `ingestKnowledgeBase({ fullResync: true })` occasionally (the "Volledig
 * herbouwen" link in /admin/ai) to heal that, and to clean up chunks for
 * sources that were deleted entirely (incremental sync never removes
 * chunks for a source that no longer exists).
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
  channels: string[];
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
      `Contentitem "${item.title}" (klant: ${companyName}, kanalen: ${item.channels.join(", ")}) — status: ${item.status}, gepland: ${
        item.scheduled_for ?? "niet gepland"
      }.\n${item.caption ?? ""}`
    );
    for (const comment of item.content_item_comments) {
      push(chunks, item.company_id, "content_item", item.id, `Opmerking bij contentitem "${item.title}": ${comment.body}`);
    }
  }

  return chunks;
}

type SupabaseRLSClient = ReturnType<typeof createClient>;

async function getChangedProjectIds(supabase: SupabaseRLSClient, watermark: string): Promise<Set<string>> {
  const [{ data: byUpdate }, { data: byComment }, { data: byTimeline }] = await Promise.all([
    supabase.from("projects").select("id").gte("updated_at", watermark),
    supabase.from("project_comments").select("project_id").gte("created_at", watermark),
    supabase.from("project_timeline_events").select("project_id").gte("occurred_at", watermark),
  ]);
  const ids = new Set<string>();
  for (const r of (byUpdate ?? []) as { id: string }[]) ids.add(r.id);
  for (const r of (byComment ?? []) as { project_id: string }[]) ids.add(r.project_id);
  for (const r of (byTimeline ?? []) as { project_id: string }[]) ids.add(r.project_id);
  return ids;
}

async function getChangedTicketIds(supabase: SupabaseRLSClient, watermark: string): Promise<Set<string>> {
  const [{ data: byUpdate }, { data: byMessage }] = await Promise.all([
    supabase.from("tickets").select("id").gte("updated_at", watermark),
    supabase.from("ticket_messages").select("ticket_id").gte("created_at", watermark),
  ]);
  const ids = new Set<string>();
  for (const r of (byUpdate ?? []) as { id: string }[]) ids.add(r.id);
  for (const r of (byMessage ?? []) as { ticket_id: string }[]) ids.add(r.ticket_id);
  return ids;
}

async function getChangedDeliverableIds(supabase: SupabaseRLSClient, watermark: string): Promise<Set<string>> {
  // deliverables itself has no updated_at (migration 0001) — a new version
  // or a new comment on a version are the only ways one changes.
  const [{ data: byVersion }, { data: byComment }] = await Promise.all([
    supabase.from("deliverable_versions").select("deliverable_id").gte("created_at", watermark),
    supabase
      .from("deliverable_comments")
      .select("deliverable_versions ( deliverable_id )")
      .gte("created_at", watermark),
  ]);
  const ids = new Set<string>();
  for (const r of (byVersion ?? []) as { deliverable_id: string }[]) ids.add(r.deliverable_id);
  for (const r of (byComment ?? []) as unknown as { deliverable_versions: { deliverable_id: string } | null }[]) {
    if (r.deliverable_versions?.deliverable_id) ids.add(r.deliverable_versions.deliverable_id);
  }
  return ids;
}

async function getChangedContentItemIds(supabase: SupabaseRLSClient, watermark: string): Promise<Set<string>> {
  const [{ data: byUpdate }, { data: byComment }] = await Promise.all([
    supabase.from("content_items").select("id").gte("updated_at", watermark),
    supabase.from("content_item_comments").select("content_item_id").gte("created_at", watermark),
  ]);
  const ids = new Set<string>();
  for (const r of (byUpdate ?? []) as { id: string }[]) ids.add(r.id);
  for (const r of (byComment ?? []) as { content_item_id: string }[]) ids.add(r.content_item_id);
  return ids;
}

/** Staff-triggered from /admin/ai — the RLS-bound session is the read path. */
export async function ingestKnowledgeBase(options?: { fullResync?: boolean }): Promise<IngestResult> {
  await assertTdvStaff();
  return runIngest(createClient(), options);
}

/**
 * Cron-triggered — see app/api/cron/ai-ingest/route.ts, which is the actual
 * authorization boundary (checks the CRON_SECRET bearer header; there is no
 * user session on a cron invocation for assertTdvStaff() to check). Reads
 * through the admin client too instead of the RLS-bound one, since there's
 * no staff session for is_tdv_staff() to grant cross-company access to.
 */
export async function ingestKnowledgeBaseAsCronJob(options?: { fullResync?: boolean }): Promise<IngestResult> {
  return runIngest(createAdminClient(), options);
}

async function runIngest(supabase: SupabaseRLSClient, options?: { fullResync?: boolean }): Promise<IngestResult> {
  if (!isServiceRoleConfigured()) {
    throw new Error("SERVICE_ROLE_NOT_CONFIGURED");
  }

  const admin = createAdminClient(); // ai_documents has no write policy for anyone

  let watermark: string | null = null;
  if (!options?.fullResync) {
    const { data: latest } = await supabase
      .from("ai_documents")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    watermark = (latest as { created_at: string } | null)?.created_at ?? null;
  }
  // No prior ai_documents row (first run ever) behaves the same as an
  // explicit full resync — there's nothing to diff against.
  const incremental = watermark !== null;

  let projectIds: string[] | null = null;
  let ticketIds: string[] | null = null;
  let deliverableIds: string[] | null = null;
  let contentItemIds: string[] | null = null;

  if (incremental) {
    const [changedProjects, changedTickets, changedDeliverables, changedContentItems] = await Promise.all([
      getChangedProjectIds(supabase, watermark!),
      getChangedTicketIds(supabase, watermark!),
      getChangedDeliverableIds(supabase, watermark!),
      getChangedContentItemIds(supabase, watermark!),
    ]);
    projectIds = [...changedProjects];
    ticketIds = [...changedTickets];
    deliverableIds = [...changedDeliverables];
    contentItemIds = [...changedContentItems];
  }

  // Incremental: only fetch the sources that actually changed. An empty
  // .in() filter correctly yields zero rows (not an error), but skipping
  // the query entirely avoids a pointless round trip when nothing changed
  // for that source type.
  let projectsQuery = supabase
    .from("projects")
    .select(
      "id, company_id, name, description, status, deadline, companies ( name ), project_comments ( body ), project_timeline_events ( title, description, occurred_at )"
    );
  if (incremental) projectsQuery = projectsQuery.in("id", projectIds!);

  let ticketsQuery = supabase
    .from("tickets")
    .select("id, company_id, subject, status, priority, companies ( name ), ticket_messages ( body )");
  if (incremental) ticketsQuery = ticketsQuery.in("id", ticketIds!);

  let deliverablesQuery = supabase
    .from("deliverables")
    .select(
      "id, title, projects ( company_id, name ), deliverable_versions ( version_number, status, deliverable_comments ( body ) )"
    );
  if (incremental) deliverablesQuery = deliverablesQuery.in("id", deliverableIds!);

  let contentItemsQuery = supabase
    .from("content_items")
    .select(
      "id, company_id, title, caption, channels, status, scheduled_for, companies ( name ), content_item_comments ( body )"
    );
  if (incremental) contentItemsQuery = contentItemsQuery.in("id", contentItemIds!);

  const [projectsRes, ticketsRes, deliverablesRes, contentItemsRes] = await Promise.all([
    incremental && projectIds!.length === 0 ? Promise.resolve({ data: [], error: null }) : projectsQuery,
    incremental && ticketIds!.length === 0 ? Promise.resolve({ data: [], error: null }) : ticketsQuery,
    incremental && deliverableIds!.length === 0 ? Promise.resolve({ data: [], error: null }) : deliverablesQuery,
    incremental && contentItemIds!.length === 0 ? Promise.resolve({ data: [], error: null }) : contentItemsQuery,
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

  if (incremental) {
    // Only clear chunks for the sources being rebuilt — everything else is
    // left exactly as it was.
    const idsByType: [IngestedSourceType, string[] | null][] = [
      ["project", projectIds],
      ["ticket", ticketIds],
      ["deliverable", deliverableIds],
      ["content_item", contentItemIds],
    ];
    for (const [sourceType, ids] of idsByType) {
      if (!ids || ids.length === 0) continue;
      const { error } = await admin.from("ai_documents").delete().eq("source_type", sourceType).in("source_id", ids);
      if (error) throw new Error(`Kon oude kennisbank-fragmenten niet verwijderen: ${error.message}`);
    }
  } else {
    const { error: deleteError } = await admin.from("ai_documents").delete().in("source_type", INGESTED_SOURCE_TYPES);
    if (deleteError) throw new Error(`Kon oude kennisbank-fragmenten niet verwijderen: ${deleteError.message}`);
  }

  let written = 0;
  for (let i = 0; i < rows.length; i += EMBED_BATCH_SIZE) {
    const batch = rows.slice(i, i + EMBED_BATCH_SIZE);
    const { error: insertError } = await admin.from("ai_documents").insert(batch);
    if (insertError) throw new Error(`Kon kennisbank-fragmenten niet opslaan: ${insertError.message}`);
    written += batch.length;
  }

  return { chunksWritten: written, companiesTouched: companiesTouched.size };
}
