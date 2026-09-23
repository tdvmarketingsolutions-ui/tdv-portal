-- Self-registered companies (via /register) start out unreviewed — TDV
-- staff needs to look them over before treating them as a real client.
-- Companies created by staff through /admin/clients default straight to
-- 'active', since a staff member creating one has already vetted it.
alter table companies
  add column onboarding_status text not null default 'active'
    check (onboarding_status in ('pending_review', 'active'));
