-- content_items had a select and a client-facing update policy, but no
-- insert policy at all — meaning nobody, not even staff, could create a
-- content item through the RLS-bound client. Mirrors projects_write_staff.
create policy "content_items_insert_staff" on content_items for insert
  with check (is_tdv_staff());
