-- Real, user-creatable nested folders for /files (OneDrive-style), replacing
-- the fixed category-only "folders" from migration... well, there was no
-- migration for that — it was a pure UI grouping on top of files.category,
-- which stays as-is (still a useful tag, shown as a badge). This table is
-- the actual hierarchy: folders can nest under folders, and files can live
-- inside a folder or at the root (folder_id null).
create table folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  parent_id uuid references folders(id) on delete cascade,
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table files add column folder_id uuid references folders(id) on delete set null;

create policy "folders_select" on folders for select
  using (is_tdv_staff() or company_id = current_company_id());

-- Same "anyone on the company can add, only staff or the creator can remove"
-- shape as files_insert/files_delete (migration 0001 / 0005) — a shared
-- company drive, not a per-user one.
create policy "folders_insert" on folders for insert
  with check (is_tdv_staff() or company_id = current_company_id());

create policy "folders_delete" on folders for delete
  using (is_tdv_staff() or (company_id = current_company_id() and created_by = auth.uid()));
