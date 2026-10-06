-- Needed so a file can be moved between folders (drag-and-drop on /files).
-- Same shape as files_delete (migration 0005): staff, or the uploader
-- within their own company.
create policy "files_update" on files for update
  using (is_tdv_staff() or (company_id = current_company_id() and uploaded_by = auth.uid()));
