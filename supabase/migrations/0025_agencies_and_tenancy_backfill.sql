-- ============================================================================
-- Multi-tenant foundation: `agencies` as a new layer above `companies`.
-- ============================================================================
-- Today there is exactly one implicit tenant (TDV) baked into every RLS
-- policy via is_tdv_staff(): "staff" means "can see every company in the
-- database," full stop. This migration introduces the `agencies` table and
-- backfills every existing row onto a single, fixed TDV agency — on its own
-- this changes zero observable behavior (is_tdv_staff() still means the same
-- thing it always did, nothing reads agency_id yet). A later migration
-- (agency_scoped_rls) redefines the RLS layer to actually use it.
--
-- TDV is not special-cased: it becomes Agency #1 via backfill, exactly like
-- every future agency. This keeps the eventual RLS rewrite mechanical rather
-- than needing a hardcoded exception.
-- ============================================================================

create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'suspended', 'canceled')),
  -- Branding (wired up by a later migration; columns exist now so the
  -- eventual branding PR is additive, not a schema change)
  brand_name text,
  logo_url text,
  favicon_url text,
  primary_color text,
  accent_color text,
  support_email text,
  custom_domain text unique,
  -- Billing (wired up by the Billit-integration PR; same reasoning)
  plan text check (plan in ('starter', 'growth', 'agency')),
  billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly', 'quarterly', 'yearly')),
  trial_ends_at timestamptz,
  next_invoice_due_at timestamptz,
  billit_contact_id text unique,
  billing_name text,
  billing_address jsonb,
  billing_vat_number text,
  created_at timestamptz not null default now()
);

alter table agencies enable row level security;

-- Minimal policy so staff can at least read their own agency's row once
-- agency_id resolution exists below. The agency-scoped RLS migration
-- replaces/extends this; nothing depends on more than this yet.
create policy "agencies_select_own" on agencies for select
  using (
    exists (select 1 from profiles where id = auth.uid() and profiles.agency_id = agencies.id)
  );

-- A fixed, well-known id so later migrations/scripts can reference TDV's own
-- agency row safely without looking it up by name.
insert into agencies (id, name, slug, status)
values ('00000000-0000-0000-0000-000000000001', 'TDV Marketing Solutions', 'tdv', 'active');

-- ----------------------------------------------------------------------------
-- agency_id columns: add nullable, backfill to TDV, then tighten to not null
-- (except activity_log, which mirrors its already-nullable company_id).
-- ----------------------------------------------------------------------------

alter table companies add column agency_id uuid references agencies(id);
update companies set agency_id = '00000000-0000-0000-0000-000000000001';
alter table companies alter column agency_id set not null;

alter table profiles add column agency_id uuid references agencies(id);
update profiles set agency_id = '00000000-0000-0000-0000-000000000001';
alter table profiles alter column agency_id set not null;

alter table profiles add column is_platform_admin boolean not null default false;

alter table ai_documents add column agency_id uuid references agencies(id);
update ai_documents set agency_id = '00000000-0000-0000-0000-000000000001';
alter table ai_documents alter column agency_id set not null;

alter table ai_chat_messages add column agency_id uuid references agencies(id);
update ai_chat_messages set agency_id = '00000000-0000-0000-0000-000000000001';
alter table ai_chat_messages alter column agency_id set not null;

alter table activity_log add column agency_id uuid references agencies(id);
update activity_log set agency_id = '00000000-0000-0000-0000-000000000001' where company_id is not null;

-- ----------------------------------------------------------------------------
-- Integrity backstop: a profile's agency_id must always match the agency_id
-- of the company it belongs to. Without this, a bug in an admin UI (e.g. the
-- "which company does this profile belong to" dropdown) could silently
-- assign a profile to a company in a different agency — exactly the
-- cross-tenant mix-up this whole migration exists to prevent.
-- ----------------------------------------------------------------------------

create or replace function check_profile_agency_matches_company()
returns trigger
language plpgsql
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

create trigger profiles_agency_matches_company
  before insert or update on profiles
  for each row execute function check_profile_agency_matches_company();
