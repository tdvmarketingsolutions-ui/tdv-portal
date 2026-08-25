-- Scaffold for connecting a client's Instagram/Facebook/LinkedIn account so
-- TDV can eventually publish content straight from the app instead of
-- manually. Real publishing needs Meta App Review (instagram_content_publish
-- / pages_manage_posts) and LinkedIn Marketing Developer Platform access —
-- external approvals only TDV can request — so this migration only adds the
-- data model + staff-visible connection status. No OAuth flow yet: rows are
-- created manually or stay absent ("not_connected") until that flow exists.
-- Token columns are here now so the future connect flow is additive, not a
-- schema change.
create type social_platform as enum ('instagram', 'facebook', 'linkedin');
create type social_account_status as enum ('not_connected', 'connected', 'error');

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  platform social_platform not null,
  status social_account_status not null default 'not_connected',
  account_label text,
  external_account_id text,
  connected_at timestamptz,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, platform)
);

alter table social_accounts enable row level security;

-- Staff-only, in both directions: this table will hold live API tokens once
-- the connect flow exists, and clients never need to see connection
-- internals — TDV manages posting on their behalf, same framing as the
-- OneDrive integration discussed for Bestanden.
create policy "social_accounts_select_staff" on social_accounts for select
  using (is_tdv_staff());
create policy "social_accounts_insert_staff" on social_accounts for insert
  with check (is_tdv_staff());
create policy "social_accounts_update_staff" on social_accounts for update
  using (is_tdv_staff());
create policy "social_accounts_delete_staff" on social_accounts for delete
  using (is_tdv_staff());
