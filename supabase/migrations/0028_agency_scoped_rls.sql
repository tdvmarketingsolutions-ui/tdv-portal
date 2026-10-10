-- ============================================================================
-- Agency-scoped RLS: redefine "staff" to mean "staff of MY agency."
-- ============================================================================
-- Today is_tdv_staff() means "can see every company in the database," full
-- stop — correct for a single-tenant app, a real cross-tenant leak the
-- moment a second agency exists. This migration is the actual isolation
-- boundary for the multi-tenant architecture: every policy built on
-- is_tdv_staff() is dropped and recreated against is_agency_staff(), which
-- adds the missing agency-ownership check. The client-side half of every
-- policy (company_id = current_company_id()) is untouched — RLS already
-- scopes clients correctly and nothing here changes that.
--
-- This changes zero observable behavior while exactly one agency (TDV)
-- exists — every row's agency still resolves the same way. The payoff is
-- that a second agency, once created, is actually isolated.
-- ============================================================================

create or replace function current_agency_id()
returns uuid
language sql
security definer
stable
set search_path = 'public'
as $$
  select agency_id from profiles where id = auth.uid();
$$;

create or replace function is_agency_staff()
returns boolean
language sql
security definer
stable
set search_path = 'public'
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('agency_admin', 'agency_staff')
  );
$$;

-- ----------------------------------------------------------------------------
-- companies
-- ----------------------------------------------------------------------------
drop policy "companies_select" on companies;
create policy "companies_select" on companies for select
  using ((is_agency_staff() and agency_id = current_agency_id()) or id = current_company_id());

drop policy "companies_insert_staff" on companies;
create policy "companies_insert_staff" on companies for insert
  with check (is_agency_staff() and agency_id = current_agency_id());

drop policy "companies_update_staff" on companies;
create policy "companies_update_staff" on companies for update
  using (is_agency_staff() and agency_id = current_agency_id())
  with check (is_agency_staff() and agency_id = current_agency_id());

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
drop policy "profiles_select" on profiles;
create policy "profiles_select" on profiles for select
  using (
    (is_agency_staff() and agency_id = current_agency_id())
    or company_id = current_company_id()
  );

-- Known gap: this policy had zero scoping at all — any authenticated user,
-- including a client, could read every staff profile across every agency.
drop policy "profiles_select_staff_public" on profiles;
create policy "profiles_select_staff_public" on profiles for select
  using (role in ('agency_admin', 'agency_staff') and agency_id = current_agency_id());

drop policy "profiles_update_staff" on profiles;
create policy "profiles_update_staff" on profiles for update
  using (is_agency_staff() and agency_id = current_agency_id())
  with check (is_agency_staff() and agency_id = current_agency_id());

-- profiles_update_self is untouched — id = auth.uid() needs no agency check.

-- ----------------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------------
drop policy "projects_select" on projects;
create policy "projects_select" on projects for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = projects.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "projects_write_staff" on projects;
create policy "projects_write_staff" on projects for insert
  with check (is_agency_staff() and exists (select 1 from companies c where c.id = projects.company_id and c.agency_id = current_agency_id()));

drop policy "projects_update_staff" on projects;
create policy "projects_update_staff" on projects for update
  using (is_agency_staff() and exists (select 1 from companies c where c.id = projects.company_id and c.agency_id = current_agency_id()));

-- ----------------------------------------------------------------------------
-- project_timeline_events (join: project_id -> projects.company_id)
-- ----------------------------------------------------------------------------
drop policy "project_timeline_select" on project_timeline_events;
create policy "project_timeline_select" on project_timeline_events for select
  using (
    (is_agency_staff() and exists (
      select 1 from projects p join companies c on c.id = p.company_id
      where p.id = project_timeline_events.project_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from projects p where p.id = project_timeline_events.project_id and p.company_id = current_company_id())
  );

drop policy "project_timeline_insert_staff" on project_timeline_events;
create policy "project_timeline_insert_staff" on project_timeline_events for insert
  with check (is_agency_staff() and exists (
    select 1 from projects p join companies c on c.id = p.company_id
    where p.id = project_timeline_events.project_id and c.agency_id = current_agency_id()
  ));

-- ----------------------------------------------------------------------------
-- project_comments (join: project_id -> projects.company_id)
-- ----------------------------------------------------------------------------
drop policy "project_comments_select" on project_comments;
create policy "project_comments_select" on project_comments for select
  using (
    (is_agency_staff() and exists (
      select 1 from projects p join companies c on c.id = p.company_id
      where p.id = project_comments.project_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from projects p where p.id = project_comments.project_id and p.company_id = current_company_id())
  );

drop policy "project_comments_insert" on project_comments;
create policy "project_comments_insert" on project_comments for insert
  with check (
    (is_agency_staff() and exists (
      select 1 from projects p join companies c on c.id = p.company_id
      where p.id = project_comments.project_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from projects p where p.id = project_comments.project_id and p.company_id = current_company_id())
  );

-- ----------------------------------------------------------------------------
-- tickets
-- ----------------------------------------------------------------------------
drop policy "tickets_select" on tickets;
create policy "tickets_select" on tickets for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = tickets.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "tickets_insert" on tickets;
create policy "tickets_insert" on tickets for insert
  with check (
    (is_agency_staff() and exists (select 1 from companies c where c.id = tickets.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "tickets_update" on tickets;
create policy "tickets_update" on tickets for update
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = tickets.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

-- ----------------------------------------------------------------------------
-- ticket_messages (join: ticket_id -> tickets.company_id)
-- ----------------------------------------------------------------------------
drop policy "ticket_messages_select" on ticket_messages;
create policy "ticket_messages_select" on ticket_messages for select
  using (
    (is_agency_staff() and exists (
      select 1 from tickets t join companies c on c.id = t.company_id
      where t.id = ticket_messages.ticket_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from tickets t where t.id = ticket_messages.ticket_id and t.company_id = current_company_id())
  );

drop policy "ticket_messages_insert" on ticket_messages;
create policy "ticket_messages_insert" on ticket_messages for insert
  with check (
    (is_agency_staff() and exists (
      select 1 from tickets t join companies c on c.id = t.company_id
      where t.id = ticket_messages.ticket_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from tickets t where t.id = ticket_messages.ticket_id and t.company_id = current_company_id())
  );

-- ----------------------------------------------------------------------------
-- deliverables (join: project_id -> projects.company_id)
-- ----------------------------------------------------------------------------
drop policy "deliverables_select" on deliverables;
create policy "deliverables_select" on deliverables for select
  using (
    (is_agency_staff() and exists (
      select 1 from projects p join companies c on c.id = p.company_id
      where p.id = deliverables.project_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from projects p where p.id = deliverables.project_id and p.company_id = current_company_id())
  );

drop policy "deliverables_insert_staff" on deliverables;
create policy "deliverables_insert_staff" on deliverables for insert
  with check (is_agency_staff() and exists (
    select 1 from projects p join companies c on c.id = p.company_id
    where p.id = deliverables.project_id and c.agency_id = current_agency_id()
  ));

-- ----------------------------------------------------------------------------
-- deliverable_versions (join: deliverable_id -> deliverables -> projects.company_id)
-- ----------------------------------------------------------------------------
drop policy "deliverable_versions_select" on deliverable_versions;
create policy "deliverable_versions_select" on deliverable_versions for select
  using (
    (is_agency_staff() and exists (
      select 1 from deliverables d join projects p on p.id = d.project_id join companies c on c.id = p.company_id
      where d.id = deliverable_versions.deliverable_id and c.agency_id = current_agency_id()
    ))
    or exists (
      select 1 from deliverables d join projects p on p.id = d.project_id
      where d.id = deliverable_versions.deliverable_id and p.company_id = current_company_id()
    )
  );

drop policy "deliverable_versions_insert_staff" on deliverable_versions;
create policy "deliverable_versions_insert_staff" on deliverable_versions for insert
  with check (is_agency_staff() and exists (
    select 1 from deliverables d join projects p on p.id = d.project_id join companies c on c.id = p.company_id
    where d.id = deliverable_versions.deliverable_id and c.agency_id = current_agency_id()
  ));

drop policy "deliverable_versions_update_client" on deliverable_versions;
create policy "deliverable_versions_update_client" on deliverable_versions for update
  using (
    (is_agency_staff() and exists (
      select 1 from deliverables d join projects p on p.id = d.project_id join companies c on c.id = p.company_id
      where d.id = deliverable_versions.deliverable_id and c.agency_id = current_agency_id()
    ))
    or exists (
      select 1 from deliverables d join projects p on p.id = d.project_id
      where d.id = deliverable_versions.deliverable_id and p.company_id = current_company_id()
    )
  );

-- ----------------------------------------------------------------------------
-- deliverable_comments (join: deliverable_version_id -> ... -> projects.company_id)
-- ----------------------------------------------------------------------------
drop policy "deliverable_comments_select" on deliverable_comments;
create policy "deliverable_comments_select" on deliverable_comments for select
  using (
    (is_agency_staff() and exists (
      select 1 from deliverable_versions dv
      join deliverables d on d.id = dv.deliverable_id
      join projects p on p.id = d.project_id
      join companies c on c.id = p.company_id
      where dv.id = deliverable_comments.deliverable_version_id and c.agency_id = current_agency_id()
    ))
    or exists (
      select 1 from deliverable_versions dv
      join deliverables d on d.id = dv.deliverable_id
      join projects p on p.id = d.project_id
      where dv.id = deliverable_comments.deliverable_version_id and p.company_id = current_company_id()
    )
  );

drop policy "deliverable_comments_insert" on deliverable_comments;
create policy "deliverable_comments_insert" on deliverable_comments for insert
  with check (
    (is_agency_staff() and exists (
      select 1 from deliverable_versions dv
      join deliverables d on d.id = dv.deliverable_id
      join projects p on p.id = d.project_id
      join companies c on c.id = p.company_id
      where dv.id = deliverable_comments.deliverable_version_id and c.agency_id = current_agency_id()
    ))
    or exists (
      select 1 from deliverable_versions dv
      join deliverables d on d.id = dv.deliverable_id
      join projects p on p.id = d.project_id
      where dv.id = deliverable_comments.deliverable_version_id and p.company_id = current_company_id()
    )
  );

-- ----------------------------------------------------------------------------
-- content_items
-- ----------------------------------------------------------------------------
drop policy "content_items_select" on content_items;
create policy "content_items_select" on content_items for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = content_items.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "content_items_update_client" on content_items;
create policy "content_items_update_client" on content_items for update
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = content_items.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "content_items_insert_staff" on content_items;
create policy "content_items_insert_staff" on content_items for insert
  with check (is_agency_staff() and exists (select 1 from companies c where c.id = content_items.company_id and c.agency_id = current_agency_id()));

drop policy "content_items_delete_staff" on content_items;
create policy "content_items_delete_staff" on content_items for delete
  using (is_agency_staff() and exists (select 1 from companies c where c.id = content_items.company_id and c.agency_id = current_agency_id()));

-- ----------------------------------------------------------------------------
-- content_item_comments (join: content_item_id -> content_items.company_id)
-- ----------------------------------------------------------------------------
drop policy "content_item_comments_select" on content_item_comments;
create policy "content_item_comments_select" on content_item_comments for select
  using (
    (is_agency_staff() and exists (
      select 1 from content_items ci join companies c on c.id = ci.company_id
      where ci.id = content_item_comments.content_item_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from content_items ci where ci.id = content_item_comments.content_item_id and ci.company_id = current_company_id())
  );

drop policy "content_item_comments_insert" on content_item_comments;
create policy "content_item_comments_insert" on content_item_comments for insert
  with check (
    (is_agency_staff() and exists (
      select 1 from content_items ci join companies c on c.id = ci.company_id
      where ci.id = content_item_comments.content_item_id and c.agency_id = current_agency_id()
    ))
    or exists (select 1 from content_items ci where ci.id = content_item_comments.content_item_id and ci.company_id = current_company_id())
  );

-- ----------------------------------------------------------------------------
-- files
-- ----------------------------------------------------------------------------
drop policy "files_select" on files;
create policy "files_select" on files for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = files.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "files_insert" on files;
create policy "files_insert" on files for insert
  with check (
    (is_agency_staff() and exists (select 1 from companies c where c.id = files.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "files_update" on files;
create policy "files_update" on files for update
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = files.company_id and c.agency_id = current_agency_id()))
    or (company_id = current_company_id() and uploaded_by = auth.uid())
  );

drop policy "files_delete" on files;
create policy "files_delete" on files for delete
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = files.company_id and c.agency_id = current_agency_id()))
    or (company_id = current_company_id() and uploaded_by = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- folders
-- ----------------------------------------------------------------------------
drop policy "folders_select" on folders;
create policy "folders_select" on folders for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = folders.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "folders_insert" on folders;
create policy "folders_insert" on folders for insert
  with check (
    (is_agency_staff() and exists (select 1 from companies c where c.id = folders.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "folders_delete" on folders;
create policy "folders_delete" on folders for delete
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = folders.company_id and c.agency_id = current_agency_id()))
    or (company_id = current_company_id() and created_by = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- project_requests
-- ----------------------------------------------------------------------------
drop policy "project_requests_select" on project_requests;
create policy "project_requests_select" on project_requests for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = project_requests.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "project_requests_insert" on project_requests;
create policy "project_requests_insert" on project_requests for insert
  with check (
    (is_agency_staff() and exists (select 1 from companies c where c.id = project_requests.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "project_requests_update_staff" on project_requests;
create policy "project_requests_update_staff" on project_requests for update
  using (is_agency_staff() and exists (select 1 from companies c where c.id = project_requests.company_id and c.agency_id = current_agency_id()));

-- ----------------------------------------------------------------------------
-- oauth_connections (table exists live; no migration file ever created it —
-- flagged separately, out of scope here beyond closing this RLS gap)
-- ----------------------------------------------------------------------------
drop policy "oauth_connections_select" on oauth_connections;
create policy "oauth_connections_select" on oauth_connections for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = oauth_connections.company_id and c.agency_id = current_agency_id()))
    or company_id = current_company_id()
  );

drop policy "oauth_connections_insert_staff" on oauth_connections;
create policy "oauth_connections_insert_staff" on oauth_connections for insert
  with check (is_agency_staff() and exists (select 1 from companies c where c.id = oauth_connections.company_id and c.agency_id = current_agency_id()));

drop policy "oauth_connections_update_staff" on oauth_connections;
create policy "oauth_connections_update_staff" on oauth_connections for update
  using (is_agency_staff() and exists (select 1 from companies c where c.id = oauth_connections.company_id and c.agency_id = current_agency_id()));

drop policy "oauth_connections_delete_staff" on oauth_connections;
create policy "oauth_connections_delete_staff" on oauth_connections for delete
  using (is_agency_staff() and exists (select 1 from companies c where c.id = oauth_connections.company_id and c.agency_id = current_agency_id()));

-- ----------------------------------------------------------------------------
-- social_accounts — known gap: all four policies were bare is_tdv_staff(),
-- zero company scoping at all. Any staff could read/write any agency's
-- client social-media tokens.
-- ----------------------------------------------------------------------------
drop policy "social_accounts_select_staff" on social_accounts;
create policy "social_accounts_select_staff" on social_accounts for select
  using (is_agency_staff() and exists (select 1 from companies c where c.id = social_accounts.company_id and c.agency_id = current_agency_id()));

drop policy "social_accounts_insert_staff" on social_accounts;
create policy "social_accounts_insert_staff" on social_accounts for insert
  with check (is_agency_staff() and exists (select 1 from companies c where c.id = social_accounts.company_id and c.agency_id = current_agency_id()));

drop policy "social_accounts_update_staff" on social_accounts;
create policy "social_accounts_update_staff" on social_accounts for update
  using (is_agency_staff() and exists (select 1 from companies c where c.id = social_accounts.company_id and c.agency_id = current_agency_id()));

drop policy "social_accounts_delete_staff" on social_accounts;
create policy "social_accounts_delete_staff" on social_accounts for delete
  using (is_agency_staff() and exists (select 1 from companies c where c.id = social_accounts.company_id and c.agency_id = current_agency_id()));

-- ----------------------------------------------------------------------------
-- ai_chat_messages / ai_conversations / activity_log
-- ----------------------------------------------------------------------------
-- Uses ai_chat_messages.agency_id directly (denormalized in 0025) rather
-- than a companies join — same value, one less join.
drop policy "ai_chat_messages_select" on ai_chat_messages;
create policy "ai_chat_messages_select" on ai_chat_messages for select
  using (
    (is_agency_staff() and agency_id = current_agency_id())
    or (user_id = auth.uid() and company_id = current_company_id())
  );

drop policy "ai_conversations_select" on ai_conversations;
create policy "ai_conversations_select" on ai_conversations for select
  using (
    (is_agency_staff() and exists (select 1 from companies c where c.id = ai_conversations.company_id and c.agency_id = current_agency_id()))
    or (user_id = auth.uid() and company_id = current_company_id())
  );

-- Uses activity_log.agency_id directly (added in 0025), not a join through
-- companies: company_id is nullable here (platform-wide events), so a join
-- would wrongly hide those rows from an agency's own staff.
drop policy "activity_log_select" on activity_log;
create policy "activity_log_select" on activity_log for select
  using (
    (is_agency_staff() and agency_id = current_agency_id())
    or company_id = current_company_id()
  );

-- ----------------------------------------------------------------------------
-- match_ai_documents RPC — belt-and-suspenders squared: filter by both
-- agency_id and company_id, not just company_id. The new signature has an
-- extra parameter, so `create or replace` would leave the old 3-arg version
-- (company_id-only, no agency check) sitting alongside the new one as a
-- second overload — drop it explicitly first.
--
-- Also adds `security definer`, missing on the original (0002_ai_search.sql):
-- ai_documents has row level security enabled with zero policies (by
-- design, see CLAUDE.md), so an invoker-rights function calling into it runs
-- under the caller's own RLS and gets zero rows back, always — the function
-- itself was the intended bypass path and never actually worked as one. This
-- has had no observable effect yet because the ai_documents ingest pipeline
-- doesn't exist, so the table is empty regardless — fixed here while the
-- function is already being touched for the agency scoping anyway.
-- ----------------------------------------------------------------------------
drop function if exists match_ai_documents(vector, uuid, integer);

create or replace function match_ai_documents(
  query_embedding vector,
  match_company_id uuid,
  match_agency_id uuid,
  match_count integer default 8
)
returns table(id uuid, content text, similarity double precision)
language sql
stable
security definer
set search_path = 'public'
as $$
  select
    ai_documents.id,
    ai_documents.content,
    1 - (ai_documents.embedding <=> query_embedding) as similarity
  from ai_documents
  where ai_documents.company_id = match_company_id
    and ai_documents.agency_id = match_agency_id
  order by ai_documents.embedding <=> query_embedding
  limit match_count;
$$;

-- ----------------------------------------------------------------------------
-- storage.objects — client-files: only the staff branch changes, the path
-- convention ((storage.foldername(name))[1] = company_id) is unchanged.
-- ----------------------------------------------------------------------------
drop policy "client_files_select" on storage.objects;
create policy "client_files_select" on storage.objects for select
  using (
    bucket_id = 'client-files'
    and (
      (is_agency_staff() and exists (select 1 from companies c where c.id::text = (storage.foldername(name))[1] and c.agency_id = current_agency_id()))
      or (storage.foldername(name))[1] = current_company_id()::text
    )
  );

drop policy "client_files_insert" on storage.objects;
create policy "client_files_insert" on storage.objects for insert
  with check (
    bucket_id = 'client-files'
    and (
      (is_agency_staff() and exists (select 1 from companies c where c.id::text = (storage.foldername(name))[1] and c.agency_id = current_agency_id()))
      or (storage.foldername(name))[1] = current_company_id()::text
    )
  );

drop policy "client_files_delete" on storage.objects;
create policy "client_files_delete" on storage.objects for delete
  using (
    bucket_id = 'client-files'
    and (
      (is_agency_staff() and exists (select 1 from companies c where c.id::text = (storage.foldername(name))[1] and c.agency_id = current_agency_id()))
      or ((storage.foldername(name))[1] = current_company_id()::text and owner = auth.uid())
    )
  );

-- company-logos: select stays fully public (company_logos_select_public is
-- untouched — logos are meant to render for anyone, no auth required).
drop policy "company_logos_insert_staff" on storage.objects;
create policy "company_logos_insert_staff" on storage.objects for insert
  with check (
    bucket_id = 'company-logos'
    and is_agency_staff()
    and exists (select 1 from companies c where c.id::text = (storage.foldername(name))[1] and c.agency_id = current_agency_id())
  );

drop policy "company_logos_update_staff" on storage.objects;
create policy "company_logos_update_staff" on storage.objects for update
  using (
    bucket_id = 'company-logos'
    and is_agency_staff()
    and exists (select 1 from companies c where c.id::text = (storage.foldername(name))[1] and c.agency_id = current_agency_id())
  );

drop policy "company_logos_delete_staff" on storage.objects;
create policy "company_logos_delete_staff" on storage.objects for delete
  using (
    bucket_id = 'company-logos'
    and is_agency_staff()
    and exists (select 1 from companies c where c.id::text = (storage.foldername(name))[1] and c.agency_id = current_agency_id())
  );

-- ----------------------------------------------------------------------------
-- respond_to_project_request_price(): a plpgsql function, not a policy, so
-- the earlier blanket search for is_tdv_staff() in pg_policies never caught
-- it. plpgsql bodies aren't dependency-tracked, so dropping is_tdv_staff()
-- without fixing this first would leave it silently broken (only erroring
-- the next time someone actually calls it) rather than failing loudly here.
-- ----------------------------------------------------------------------------
create or replace function public.respond_to_project_request_price(request_id uuid, accepted boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  target_company_id uuid;
begin
  select company_id into target_company_id
  from project_requests
  where id = request_id and price_response = 'pending';

  if target_company_id is null then
    raise exception 'Aanvraag niet gevonden of al beantwoord.';
  end if;

  if not (
    (is_agency_staff() and exists (select 1 from companies c where c.id = target_company_id and c.agency_id = current_agency_id()))
    or target_company_id = current_company_id()
  ) then
    raise exception 'Geen toegang tot deze aanvraag.';
  end if;

  update project_requests
  set price_response = case when accepted then 'accepted'::project_request_price_response else 'declined'::project_request_price_response end,
      status = case when accepted then 'awaiting_quote'::project_request_status else 'declined'::project_request_status end,
      updated_at = now()
  where id = request_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Retire is_tdv_staff(): nothing references it anymore after this migration.
-- ----------------------------------------------------------------------------
drop function is_tdv_staff();
