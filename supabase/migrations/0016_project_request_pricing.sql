-- ----------------------------------------------------------------------------
-- AI-generated indicative price on project requests.
--
-- Right after a client submits a project request, a best-effort AI call
-- (lib/ai/indicative-price.ts) fills in a rough price range + disclaimer note
-- so the client isn't left guessing while staff prepares the real offerte.
-- The client then explicitly accepts or declines that indicative price —
-- accepting moves the request to 'awaiting_quote' (staff now prepares the
-- real quote by e-mail, as before), declining moves it straight to
-- 'declined'. This is still not a real offerte: no line items, no PDF, just
-- a number to set expectations.
--
-- The accept/decline write goes through a SECURITY DEFINER function instead
-- of a client-facing UPDATE policy: a plain RLS UPDATE policy can't restrict
-- *which columns* a client changes (only which rows), so a client could in
-- principle smuggle other fields (status, title, ...) into the same request.
-- respond_to_project_request_price() only ever touches price_response +
-- status, and re-checks staff-or-own-company access itself — same reasoning
-- as the match_ai_documents RPC exception in migration 0002.
-- ----------------------------------------------------------------------------
create type project_request_price_response as enum ('pending', 'accepted', 'declined');

alter table project_requests
  add column indicative_price_range text,
  add column indicative_price_note text,
  add column price_response project_request_price_response not null default 'pending';

create or replace function respond_to_project_request_price(request_id uuid, accepted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company_id uuid;
begin
  select company_id into target_company_id
  from project_requests
  where id = request_id and price_response = 'pending';

  if target_company_id is null then
    raise exception 'Aanvraag niet gevonden of al beantwoord.';
  end if;

  if not is_tdv_staff() and target_company_id <> current_company_id() then
    raise exception 'Geen toegang tot deze aanvraag.';
  end if;

  update project_requests
  set price_response = case when accepted then 'accepted'::project_request_price_response else 'declined'::project_request_price_response end,
      status = case when accepted then 'awaiting_quote'::project_request_status else 'declined'::project_request_status end,
      updated_at = now()
  where id = request_id;
end;
$$;

grant execute on function respond_to_project_request_price(uuid, boolean) to authenticated;
