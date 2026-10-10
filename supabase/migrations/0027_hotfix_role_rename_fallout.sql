-- ============================================================================
-- Hotfix: two functions left broken by the 0026 role rename.
-- ============================================================================
-- 0026 renamed the `user_role` enum values (tdv_admin -> agency_admin,
-- tdv_staff -> agency_staff) but only `alter type ... rename value` is
-- metadata-only — it does not touch function BODIES that reference the old
-- literal strings. Two functions still compared against the now-nonexistent
-- 'tdv_admin'/'tdv_staff' labels, which makes Postgres raise "invalid input
-- value for enum user_role" the moment the string literal is cast. This was
-- a full outage: every RLS policy that calls is_tdv_staff() failed (not just
-- "returned false") for every user, staff and client alike, since the OR in
-- `is_tdv_staff() OR company_id = current_company_id()` can't short-circuit
-- around a thrown error.
--
-- is_tdv_staff(): fixed to check the new role literals.
-- ============================================================================

create or replace function is_tdv_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('agency_admin', 'agency_staff')
  );
$$;

-- ----------------------------------------------------------------------------
-- handle_new_user(): a second, separate bug — unrelated to the role rename,
-- pre-existing, but surfaced by the same audit. A trigger on auth.users
-- (on_auth_user_created, defined directly against the live database at some
-- point — no corresponding migration file exists for it, so this is also the
-- first time it's captured in version control) auto-provisioned a `profiles`
-- row with role = 'client', which was never a valid user_role value at all
-- (the enum has always been tdv_admin/tdv_staff/client_admin/client_member,
-- now agency_admin/agency_staff/client_admin/client_member). Since this
-- trigger fires on every insert into auth.users, it broke BOTH:
--   - self-registration (app/(auth)/register/actions.ts calls
--     admin.auth.admin.createUser(), which inserts into auth.users)
--   - staff-invited users (lib/data/admin/users.ts inviteUser() calls
--     admin.auth.admin.inviteUserByEmail(), same underlying insert)
-- Both of those already create their own `companies`/`profiles` rows
-- correctly in application code (see the comment in registerAction) — this
-- trigger was redundant even when it worked, and duplicated the company
-- creation on top of using an invalid role.
--
-- `drop trigger ... on auth.users` could not be applied from this session
-- (DDL against the auth schema timed out repeatedly, unlike every other
-- table) — neutering the function body it calls is the safe equivalent: the
-- trigger still fires on every new user, but now does nothing. Dropping the
-- trigger itself is a follow-up for whoever has dashboard/CLI access to the
-- auth schema; it's cosmetic cleanup at this point, not a correctness issue.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  return new;
end;
$$;
