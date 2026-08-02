-- ============================================================================
-- TDV Client Portal — initial schema
-- ============================================================================
-- Tenancy model: every client-facing row hangs off `companies`. A `profiles`
-- row (1:1 with auth.users) belongs to exactly one company, unless its role
-- is tdv_admin/tdv_staff (TDV's own team, who can see across companies).
-- Row Level Security enforces isolation at the database layer so that no
-- application bug can leak one client's data to another.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector"; -- for AI assistant embeddings (RAG)

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role as enum ('tdv_admin', 'tdv_staff', 'client_admin', 'client_member');
create type project_status as enum ('planning', 'in_progress', 'in_review', 'on_hold', 'completed');
create type ticket_status as enum ('new', 'in_progress', 'waiting_on_client', 'resolved');
create type ticket_priority as enum ('low', 'normal', 'high', 'urgent');
create type feedback_status as enum ('pending', 'approved', 'revision_requested');
create type content_status as enum ('draft', 'pending_approval', 'approved', 'scheduled', 'published');
create type content_channel as enum ('instagram', 'facebook', 'linkedin', 'tiktok', 'blog', 'email', 'ads', 'other');
create type notification_type as enum ('ticket', 'comment', 'approval', 'file', 'deadline');

-- ----------------------------------------------------------------------------
-- Core tenancy
-- ----------------------------------------------------------------------------
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade, -- null for tdv_admin/tdv_staff
  role user_role not null default 'client_member',
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  constraint client_profiles_need_company
    check (role in ('tdv_admin', 'tdv_staff') or company_id is not null)
);

-- ----------------------------------------------------------------------------
-- Projects
-- ----------------------------------------------------------------------------
create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'planning',
  owner_id uuid references profiles(id), -- TDV team member responsible
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_timeline_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  occurred_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

create table project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Ticketing
-- ----------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  subject text not null,
  status ticket_status not null default 'new',
  priority ticket_priority not null default 'normal',
  created_by uuid not null references profiles(id),
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Files (metadata table backing Supabase Storage objects)
-- Defined here, ahead of deliverables/content_items, because both reference
-- files.id as a foreign key.
-- ----------------------------------------------------------------------------
create table files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  storage_path text not null, -- path inside the `client-files` storage bucket
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  category text, -- 'logo' | 'brand' | 'photo' | 'video' | 'invoice' | 'contract' | 'other'
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Feedback & approvals (design/document review with versioning)
-- ----------------------------------------------------------------------------
create table deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create table deliverable_versions (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  version_number int not null,
  file_id uuid references files(id),
  status feedback_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (deliverable_id, version_number)
);

create table deliverable_comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_version_id uuid not null references deliverable_versions(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  -- Optional pin coordinates for "comment on a specific spot in an image/doc"
  anchor_x numeric,
  anchor_y numeric,
  anchor_page int,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Content planning calendar
-- ----------------------------------------------------------------------------
create table content_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  caption text,
  channel content_channel not null,
  status content_status not null default 'draft',
  scheduled_for timestamptz,
  visual_file_id uuid references files(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table content_item_comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link_path text, -- e.g. '/tickets/<id>'
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AI assistant (RAG) — per-company document chunks + embeddings
-- ----------------------------------------------------------------------------
create table ai_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  source_type text not null, -- 'project' | 'ticket' | 'file' | 'invoice' | 'manual'
  source_id uuid,            -- id of the row in the source table, if applicable
  content text not null,     -- raw chunk text
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index ai_documents_embedding_idx on ai_documents
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Activity log (admin visibility across the platform)
-- ----------------------------------------------------------------------------
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null, -- e.g. 'ticket.created', 'deliverable.approved'
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_timeline_events enable row level security;
alter table project_comments enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table deliverables enable row level security;
alter table deliverable_versions enable row level security;
alter table deliverable_comments enable row level security;
alter table content_items enable row level security;
alter table content_item_comments enable row level security;
alter table files enable row level security;
alter table notifications enable row level security;
alter table ai_documents enable row level security;
alter table ai_chat_messages enable row level security;
alter table activity_log enable row level security;

-- Helper: is the current user TDV staff (sees everything)?
create or replace function is_tdv_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('tdv_admin', 'tdv_staff')
  );
$$;

-- Helper: current user's company_id
create or replace function current_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from profiles where id = auth.uid();
$$;

-- Generic tenant-isolation policy, applied per table below. Pattern:
--   TDV staff -> full access
--   client user -> access only rows where company_id = their own company_id

create policy "companies_select" on companies for select
  using (is_tdv_staff() or id = current_company_id());

create policy "profiles_select" on profiles for select
  using (is_tdv_staff() or company_id = current_company_id());
create policy "profiles_update_self" on profiles for update
  using (id = auth.uid());

create policy "projects_select" on projects for select
  using (is_tdv_staff() or company_id = current_company_id());
create policy "projects_write_staff" on projects for insert
  with check (is_tdv_staff());
create policy "projects_update_staff" on projects for update
  using (is_tdv_staff());

create policy "project_timeline_select" on project_timeline_events for select
  using (is_tdv_staff() or exists (
    select 1 from projects p where p.id = project_id
    and p.company_id = current_company_id()
  ));

create policy "project_comments_select" on project_comments for select
  using (is_tdv_staff() or exists (
    select 1 from projects p where p.id = project_id
    and p.company_id = current_company_id()
  ));
create policy "project_comments_insert" on project_comments for insert
  with check (is_tdv_staff() or exists (
    select 1 from projects p where p.id = project_id
    and p.company_id = current_company_id()
  ));

create policy "tickets_select" on tickets for select
  using (is_tdv_staff() or company_id = current_company_id());
create policy "tickets_insert" on tickets for insert
  with check (is_tdv_staff() or company_id = current_company_id());
create policy "tickets_update" on tickets for update
  using (is_tdv_staff() or company_id = current_company_id());

create policy "ticket_messages_select" on ticket_messages for select
  using (is_tdv_staff() or exists (
    select 1 from tickets t where t.id = ticket_id
    and t.company_id = current_company_id()
  ));
create policy "ticket_messages_insert" on ticket_messages for insert
  with check (is_tdv_staff() or exists (
    select 1 from tickets t where t.id = ticket_id
    and t.company_id = current_company_id()
  ));

create policy "deliverables_select" on deliverables for select
  using (is_tdv_staff() or exists (
    select 1 from projects p where p.id = project_id
    and p.company_id = current_company_id()
  ));

create policy "deliverable_versions_select" on deliverable_versions for select
  using (is_tdv_staff() or exists (
    select 1 from deliverables d join projects p on p.id = d.project_id
    where d.id = deliverable_id and p.company_id = current_company_id()
  ));
create policy "deliverable_versions_update_client" on deliverable_versions for update
  using (is_tdv_staff() or exists (
    select 1 from deliverables d join projects p on p.id = d.project_id
    where d.id = deliverable_id and p.company_id = current_company_id()
  )); -- allows clients to flip status to approved / revision_requested

create policy "deliverable_comments_select" on deliverable_comments for select
  using (is_tdv_staff() or exists (
    select 1 from deliverable_versions dv
    join deliverables d on d.id = dv.deliverable_id
    join projects p on p.id = d.project_id
    where dv.id = deliverable_version_id and p.company_id = current_company_id()
  ));
create policy "deliverable_comments_insert" on deliverable_comments for insert
  with check (is_tdv_staff() or exists (
    select 1 from deliverable_versions dv
    join deliverables d on d.id = dv.deliverable_id
    join projects p on p.id = d.project_id
    where dv.id = deliverable_version_id and p.company_id = current_company_id()
  ));

create policy "content_items_select" on content_items for select
  using (is_tdv_staff() or company_id = current_company_id());
create policy "content_items_update_client" on content_items for update
  using (is_tdv_staff() or company_id = current_company_id());

create policy "content_item_comments_select" on content_item_comments for select
  using (is_tdv_staff() or exists (
    select 1 from content_items ci where ci.id = content_item_id
    and ci.company_id = current_company_id()
  ));
create policy "content_item_comments_insert" on content_item_comments for insert
  with check (is_tdv_staff() or exists (
    select 1 from content_items ci where ci.id = content_item_id
    and ci.company_id = current_company_id()
  ));

create policy "files_select" on files for select
  using (is_tdv_staff() or company_id = current_company_id());
create policy "files_insert" on files for insert
  with check (is_tdv_staff() or company_id = current_company_id());

create policy "notifications_select_own" on notifications for select
  using (recipient_id = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (recipient_id = auth.uid());

-- ai_documents: no client-facing select policy at all — these are only ever
-- read by the server-side RAG route using the admin client, scoped by
-- company_id in the query itself. This keeps embeddings out of reach even if
-- a bug exposed the table to PostgREST directly.

create policy "ai_chat_messages_select" on ai_chat_messages for select
  using (is_tdv_staff() or (user_id = auth.uid() and company_id = current_company_id()));
create policy "ai_chat_messages_insert" on ai_chat_messages for insert
  with check (user_id = auth.uid() and company_id = current_company_id());

create policy "activity_log_select" on activity_log for select
  using (is_tdv_staff() or company_id = current_company_id());

-- ============================================================================
-- Storage bucket for client files (create via Supabase dashboard or CLI too)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

-- Storage RLS: path convention is `${company_id}/${category}/${filename}`,
-- so we can enforce isolation by checking the first path segment.
create policy "client_files_select" on storage.objects for select
  using (
    bucket_id = 'client-files'
    and (is_tdv_staff() or (storage.foldername(name))[1] = current_company_id()::text)
  );
create policy "client_files_insert" on storage.objects for insert
  with check (
    bucket_id = 'client-files'
    and (is_tdv_staff() or (storage.foldername(name))[1] = current_company_id()::text)
  );
