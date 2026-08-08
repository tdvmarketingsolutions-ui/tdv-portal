-- Staff manage a project's timeline from /admin, but project_timeline_events
-- only had a select policy.
create policy "project_timeline_insert_staff" on project_timeline_events for insert
  with check (is_tdv_staff());
