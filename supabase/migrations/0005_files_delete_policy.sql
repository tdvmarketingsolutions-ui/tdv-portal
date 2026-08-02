-- files_select/files_insert already existed; delete was never added, so a
-- client could upload but never remove their own mistakes and staff could
-- only delete via the admin/service-role client. Mirrors the "own upload or
-- staff" pattern already used elsewhere.
create policy "files_delete" on files for delete
  using (is_tdv_staff() or (company_id = current_company_id() and uploaded_by = auth.uid()));

-- Same restriction on the underlying storage object: Supabase sets `owner`
-- to the uploading user automatically, so it doubles as the same check
-- without needing to look anything up.
create policy "client_files_delete" on storage.objects for delete
  using (
    bucket_id = 'client-files'
    and (is_tdv_staff() or ((storage.foldername(name))[1] = current_company_id()::text and owner = auth.uid()))
  );
