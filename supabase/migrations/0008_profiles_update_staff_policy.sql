-- profiles_update_self only lets a user edit their own row. Staff need to
-- update OTHER users' profiles too (role, company assignment) when managing
-- clients from /admin/users. Mirrors projects_update_staff.
create policy "profiles_update_staff" on profiles for update
  using (is_tdv_staff())
  with check (is_tdv_staff());
