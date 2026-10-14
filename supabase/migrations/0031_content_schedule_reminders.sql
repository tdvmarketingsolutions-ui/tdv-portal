-- ============================================================================
-- Overdue-scheduling reminders for content items
-- ============================================================================
-- Same gap as 0030 did for project deadlines, this time for content:
-- nothing auto-publishes content (no Meta/Instagram integration exists yet),
-- so a content_item stuck in 'scheduled' past its scheduled_for is a human
-- who forgot to post it and flip the status — and nothing ever flagged that.
-- ============================================================================

alter table content_items add column schedule_reminder_sent_at timestamptz;

create or replace function reset_content_schedule_reminder()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.scheduled_for is distinct from old.scheduled_for or new.status is distinct from old.status then
    new.schedule_reminder_sent_at := null;
  end if;
  return new;
end;
$$;

create trigger content_items_reset_schedule_reminder
  before update on content_items
  for each row execute function reset_content_schedule_reminder();
