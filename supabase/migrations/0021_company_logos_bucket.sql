-- companies.logo_url has existed since migration 0001 but nothing ever
-- wrote to it. Storing an actual logo needs somewhere to upload the file —
-- a new, PUBLIC bucket (unlike client-files) since the logo is meant to be
-- shown widely (admin client list/detail, the client's own portal chrome)
-- without regenerating a signed URL on every render; logo_url just stores
-- the bucket's public URL directly. Path convention: `${company_id}/${filename}`.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

create policy "company_logos_select_public" on storage.objects for select
  using (bucket_id = 'company-logos');
create policy "company_logos_insert_staff" on storage.objects for insert
  with check (bucket_id = 'company-logos' and is_tdv_staff());
create policy "company_logos_update_staff" on storage.objects for update
  using (bucket_id = 'company-logos' and is_tdv_staff());
create policy "company_logos_delete_staff" on storage.objects for delete
  using (bucket_id = 'company-logos' and is_tdv_staff());
