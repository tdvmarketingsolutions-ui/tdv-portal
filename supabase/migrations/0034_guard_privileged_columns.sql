-- ============================================================================
-- Privileged columns on profiles and agencies: only server-side or staff.
-- ============================================================================
-- Two gaps, both confirmed live (read-only) on 2026-10-30:
--
-- 1. profiles_update_self (0001) is `using (id = auth.uid())` with no
--    with_check and no column restriction, and `authenticated` has UPDATE on
--    every column. Any signed-in user could therefore PATCH their own row via
--    the REST API and set role = 'agency_admin', or move agency_id/company_id
--    to another tenant (TDV's own agency id is fixed and public, see 0025).
--    check_profile_agency_matches_company only checks when company_id is set,
--    so clearing company_id made any agency reachable.
--
-- 2. agencies_update_staff (0032) lets any agency staff update the whole row,
--    including status, plan, trial_ends_at and the billing fields that Billit
--    and the platform will rely on.
--
-- Fixed with BEFORE UPDATE triggers rather than revoking column grants, so
-- existing updates through the RLS client (own name, notification setting,
-- branding, staff changing a user's role in /admin/users) keep working
-- unchanged. Only tightens: no policy is dropped or widened.
--
-- "Server-side" = any request that is not an end-user JWT: the service_role
-- key (signup in app/(auth)/register, invites in lib/data/admin/users.ts,
-- crons) and direct database sessions (migrations, SQL editor) pass freely.
-- ============================================================================

create or replace function public.request_is_end_user()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  ) in ('authenticated', 'anon');
$$;

-- ----------------------------------------------------------------------------
-- profiles: role, agency_id, company_id, is_platform_admin
-- ----------------------------------------------------------------------------
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.request_is_end_user() then
    return new;
  end if;

  -- Never from the client, not even by staff: moving a profile to another
  -- agency, or granting platform rights, only happens server-side.
  if new.agency_id is distinct from old.agency_id then
    raise exception 'agency_id kan niet gewijzigd worden vanuit de app.'
      using errcode = '42501';
  end if;
  if new.is_platform_admin is distinct from old.is_platform_admin then
    raise exception 'is_platform_admin kan niet gewijzigd worden vanuit de app.'
      using errcode = '42501';
  end if;

  -- role/company_id: only staff of the profile's own agency (the
  -- /admin/users flow). check_profile_agency_matches_company (0025) still
  -- guarantees a new company_id belongs to that same agency.
  if (new.role is distinct from old.role or new.company_id is distinct from old.company_id)
     and not (public.is_agency_staff() and old.agency_id = public.current_agency_id()) then
    raise exception 'Alleen medewerkers van het bureau kunnen rol of bedrijf wijzigen.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged_columns on public.profiles;
create trigger profiles_guard_privileged_columns
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_columns();

-- ----------------------------------------------------------------------------
-- agencies: everything except branding is server-side only
-- ----------------------------------------------------------------------------
-- An allow-list rather than a block-list: any column added later (billing,
-- platform flags) is locked by default instead of silently editable by staff.
create or replace function public.guard_agency_platform_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  branding constant text[] := array[
    'brand_name', 'logo_url', 'favicon_url', 'primary_color', 'accent_color', 'support_email'
  ];
begin
  if not public.request_is_end_user() then
    return new;
  end if;

  if (to_jsonb(new) - branding) is distinct from (to_jsonb(old) - branding) then
    raise exception 'Alleen de branding van een bureau kan vanuit de app gewijzigd worden.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists agencies_guard_platform_columns on public.agencies;
create trigger agencies_guard_platform_columns
  before update on public.agencies
  for each row execute function public.guard_agency_platform_columns();
