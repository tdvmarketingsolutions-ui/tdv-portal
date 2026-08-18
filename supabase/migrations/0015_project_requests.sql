-- ----------------------------------------------------------------------------
-- Project requests — the light-touch "client asks for a project, staff
-- prepares a quote outside the app" tracker. Deliberately separate from
-- `tickets`: a support conversation and "please quote me a new project"
-- don't share a status lifecycle (tickets: new/in_progress/waiting_on_client/
-- resolved makes no sense here), so this gets its own small table rather
-- than overloading ticket_status with unrelated values.
--
-- No pricing/line-items/PDF here by design — the actual quote happens over
-- email; this table only tracks where a request stands: requested → the
-- client asked; awaiting_quote → staff is preparing one; project_active →
-- accepted and the real project exists (created separately via the normal
-- admin project flow, no hard link back to `projects` for now); declined →
-- TDV isn't taking it on.
-- ----------------------------------------------------------------------------
create type project_request_status as enum ('requested', 'awaiting_quote', 'project_active', 'declined');

create table project_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  description text,
  status project_request_status not null default 'requested',
  requested_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table project_requests enable row level security;

create policy "project_requests_select" on project_requests for select
  using (is_tdv_staff() or company_id = current_company_id());
create policy "project_requests_insert" on project_requests for insert
  with check (is_tdv_staff() or company_id = current_company_id());
create policy "project_requests_update_staff" on project_requests for update
  using (is_tdv_staff());
