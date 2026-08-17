-- Supabase Realtime only streams postgres_changes for tables explicitly
-- added to this publication. RLS (notifications_select_own) still applies
-- on top — a client only ever receives change events for rows it could
-- also SELECT, so this doesn't widen access, just makes existing reads live.
alter publication supabase_realtime add table notifications;
