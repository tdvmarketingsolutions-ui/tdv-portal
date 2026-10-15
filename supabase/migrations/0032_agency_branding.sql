-- ============================================================================
-- Per-agency branding: write access + logo storage
-- ============================================================================
-- agencies.brand_name/logo_url/favicon_url/primary_color/accent_color/
-- support_email have existed since 0025, but nothing could write to them yet
-- (only "agencies_select_own" exists) and there was nowhere to upload a
-- logo file to. This migration adds both, mirroring the exact pattern
-- already used for companies/company-logos (0009, 0021, 0028's rewrite of
-- it) — same public-bucket, same storage.foldername() ownership check, just
-- keyed by agency_id directly instead of joining through companies.
-- ============================================================================

create policy "agencies_update_staff" on agencies for update
  using (is_agency_staff() and id = current_agency_id())
  with check (is_agency_staff() and id = current_agency_id());

insert into storage.buckets (id, name, public)
values ('agency-logos', 'agency-logos', true)
on conflict (id) do nothing;

create policy "agency_logos_select_public" on storage.objects for select
  using (bucket_id = 'agency-logos');

create policy "agency_logos_insert_staff" on storage.objects for insert
  with check (
    bucket_id = 'agency-logos'
    and is_agency_staff()
    and (storage.foldername(name))[1] = current_agency_id()::text
  );

create policy "agency_logos_update_staff" on storage.objects for update
  using (
    bucket_id = 'agency-logos'
    and is_agency_staff()
    and (storage.foldername(name))[1] = current_agency_id()::text
  );

create policy "agency_logos_delete_staff" on storage.objects for delete
  using (
    bucket_id = 'agency-logos'
    and is_agency_staff()
    and (storage.foldername(name))[1] = current_agency_id()::text
  );
