-- content_items has no delete policy at all (see migration 0001) — only
-- files supports deletion so far (migration 0005). Now that the content
-- planning module is going into real production use, TDV staff need to be
-- able to remove a wrongly created draft/duplicate item while bulk-entering
-- a client's content calendar. Staff-only, matching who is allowed to
-- create content items in the first place (migration 0006) — clients never
-- get delete, only the approve/revision-request update path (migration
-- content_items_update_client).
create policy "content_items_delete_staff" on content_items for delete
  using (is_tdv_staff());
