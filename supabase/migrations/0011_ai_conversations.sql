-- The AI assistant only ever wrote to a flat ai_chat_messages list with no
-- way to group messages into separate conversations — every message a
-- client ever sent showed up as one endless thread, and there was no way to
-- start a fresh conversation or revisit an earlier one.
create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Nieuw gesprek',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_conversations enable row level security;

create policy "ai_conversations_select" on ai_conversations for select
  using (is_tdv_staff() or (user_id = auth.uid() and company_id = current_company_id()));

create policy "ai_conversations_insert" on ai_conversations for insert
  with check (user_id = auth.uid() and company_id = current_company_id());

create policy "ai_conversations_update_own" on ai_conversations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table ai_chat_messages add column conversation_id uuid references ai_conversations(id) on delete cascade;
