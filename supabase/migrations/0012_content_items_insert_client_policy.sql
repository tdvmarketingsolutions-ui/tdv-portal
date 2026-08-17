-- content_items_insert_staff (migration 0006) only ever let TDV staff create
-- content-planning items. Clients can now submit their own content ideas
-- too. RLS policies for the same command are OR'd together, so this simply
-- adds a second allowed path alongside the staff one — a client may only
-- insert a row for their own company.
create policy "content_items_insert_client" on content_items for insert
  with check (company_id = current_company_id());
