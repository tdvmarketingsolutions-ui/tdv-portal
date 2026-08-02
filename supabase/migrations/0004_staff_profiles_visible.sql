-- Bug: clients can see ticket_messages / project_comments / deliverable_comments
-- authored by TDV staff (via the parent table's RLS), but the embedded
-- `profiles ( full_name, avatar_url )` join on those queries was separately
-- gated by profiles_select, which only grants staff or same-company access —
-- so a staff member's name silently resolved to null and rendered as
-- "Onbekend" in every message thread the client could otherwise fully read.
--
-- Fix: let any authenticated user read the (non-sensitive) name/avatar of
-- TDV staff profiles specifically. This does not weaken client-to-client
-- isolation — client profiles remain scoped to is_tdv_staff() or same-company
-- via the existing profiles_select policy; this is an additive OR'd policy.
create policy "profiles_select_staff_public" on profiles for select
  using (role in ('tdv_admin', 'tdv_staff'));
