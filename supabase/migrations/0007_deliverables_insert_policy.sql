-- Same gap as content_items: deliverables and deliverable_versions had
-- select/update policies but no insert policy, so staff couldn't create a
-- deliverable or a new version through the RLS-bound client.
create policy "deliverables_insert_staff" on deliverables for insert
  with check (is_tdv_staff());

create policy "deliverable_versions_insert_staff" on deliverable_versions for insert
  with check (is_tdv_staff());
