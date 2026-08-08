-- companies only had a select policy — staff couldn't create or edit a
-- client company through the RLS-bound client. Mirrors projects_write_staff
-- / projects_update_staff.
create policy "companies_insert_staff" on companies for insert
  with check (is_tdv_staff());

create policy "companies_update_staff" on companies for update
  using (is_tdv_staff())
  with check (is_tdv_staff());
