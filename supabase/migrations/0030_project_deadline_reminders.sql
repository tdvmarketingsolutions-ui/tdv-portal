-- ============================================================================
-- Deadline reminders for projects
-- ============================================================================
-- projects.deadline has existed since 0001 but nothing ever reads it except
-- plain display — no visual urgency, no reminder. This column lets the new
-- deadline-reminders cron (lib/data/admin/deadline-reminders.ts) avoid
-- re-notifying for the same deadline on every run: set once a reminder has
-- gone out, cleared whenever the deadline itself changes (see the trigger
-- below) so moving a deadline out always re-arms a fresh reminder.
-- ============================================================================

alter table projects add column deadline_reminder_sent_at timestamptz;

create or replace function reset_project_deadline_reminder()
returns trigger
language plpgsql
set search_path = 'public'
as $$
begin
  if new.deadline is distinct from old.deadline then
    new.deadline_reminder_sent_at := null;
  end if;
  return new;
end;
$$;

create trigger projects_reset_deadline_reminder
  before update on projects
  for each row execute function reset_project_deadline_reminder();
