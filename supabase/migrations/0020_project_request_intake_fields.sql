-- The project request intake was just title + free-text description — too
-- thin for the AI to price well, and too much typing for a client who just
-- wants to leave a quick lead. Adds structured, easy-to-pick fields that
-- both make the form faster to fill in (selects instead of prose) and feed
-- the indicative-price prompt (lib/ai/indicative-price.ts) real signal.
-- All three are nullable: existing rows and the RLS/insert policy from
-- migration 0015 are untouched, this is purely additive.
create type project_request_type as enum (
  'website', 'branding', 'social_media', 'seo_sea', 'video', 'other'
);
create type budget_indication as enum (
  'under_1000', 'from_1000_to_3000', 'from_3000_to_7000', 'over_7000', 'unknown'
);

alter table project_requests
  add column project_type project_request_type,
  add column budget_indication budget_indication,
  add column desired_deadline date;
