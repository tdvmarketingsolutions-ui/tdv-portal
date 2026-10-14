-- ============================================================================
-- Security hardening: two real gaps found via Supabase's security advisor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- folders: RLS was never enabled on this table (migration 0023 created the
-- table and its policies, but never ran `enable row level security`). Policies
-- without RLS enabled do nothing — the table was fully public, readable and
-- writable by anyone with the project URL, since it was created. The policies
-- themselves are fine (and already agency-scoped as of 0028); this migration
-- is the one-line fix that actually turns them on.
-- ----------------------------------------------------------------------------
alter table folders enable row level security;

-- ----------------------------------------------------------------------------
-- match_ai_documents: the `security definer` added in 0028 (to fix retrieval
-- always returning zero rows, see that migration's comment) introduced a
-- worse bug than it fixed. The function trusted its match_company_id/
-- match_agency_id parameters outright — since it's security definer, it
-- bypasses ai_documents' RLS (which has zero policies by design) entirely, so
-- any authenticated (or even anonymous) caller could invoke
-- /rest/v1/rpc/match_ai_documents directly with ANY other agency's
-- company_id/agency_id and read their AI knowledge base. The app's own route
-- (app/api/ai/chat/route.ts) always resolved these server-side from the
-- session, so this was never exploitable through the UI — but the RPC itself
-- is public API surface, callable directly, independent of the route.
--
-- Fixed by checking the caller's own identity against the requested
-- company_id/agency_id inside the function, same pattern already used by
-- respond_to_project_request_price() — switches the function from `language
-- sql` to `language plpgsql` since it now needs a conditional before the
-- query.
-- ----------------------------------------------------------------------------
create or replace function match_ai_documents(
  query_embedding vector,
  match_company_id uuid,
  match_agency_id uuid,
  match_count integer default 8
)
returns table(id uuid, content text, similarity double precision)
language plpgsql
stable
security definer
set search_path = 'public'
as $$
begin
  if not (
    (is_agency_staff() and match_agency_id = current_agency_id())
    or match_company_id = current_company_id()
  ) then
    raise exception 'Geen toegang tot deze kennisbank.';
  end if;

  return query
  select
    ai_documents.id,
    ai_documents.content,
    1 - (ai_documents.embedding <=> query_embedding) as similarity
  from ai_documents
  where ai_documents.company_id = match_company_id
    and ai_documents.agency_id = match_agency_id
  order by ai_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- check_profile_agency_matches_company (0025): missing `set search_path`,
-- flagged by the advisor as a mutable-search-path function. Not independently
-- exploitable here (no dynamic SQL, every identifier is schema-qualified by
-- Postgres's own resolution), but there's no reason to leave it off.
-- ----------------------------------------------------------------------------
create or replace function check_profile_agency_matches_company()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.company_id is not null and new.agency_id <> (
    select agency_id from companies where id = new.company_id
  ) then
    raise exception 'profiles.agency_id must match the agency_id of profiles.company_id';
  end if;
  return new;
end;
$$;
