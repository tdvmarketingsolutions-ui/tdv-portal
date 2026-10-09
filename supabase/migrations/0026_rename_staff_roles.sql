-- ============================================================================
-- Rename the `tdv_admin`/`tdv_staff` role values to `agency_admin`/
-- `agency_staff`.
-- ============================================================================
-- `role` answers "what can this person do," not "which tenant do they
-- belong to" (that's the new `agency_id` column from the previous
-- migration). Once a second agency exists, a role literally named
-- `tdv_admin` held by that agency's own staff is actively misleading —
-- every future reader (code, comments, this migration file) would have to
-- remember that "tdv_staff" means "agency staff," full stop.
--
-- `alter type ... rename value` only touches enum metadata — no table
-- rewrite, near-instant. This MUST ship in the same release as the
-- application-code literal rename (every `"tdv_admin"`/`"tdv_staff"` string
-- comparison across the app) — if the DB enum changes without the app
-- following, every staff-gated check starts comparing against a value that
-- no longer exists and fails closed (a full staff outage, not a security
-- risk, but still an outage) until both halves are live.
-- ============================================================================

alter type user_role rename value 'tdv_admin' to 'agency_admin';
alter type user_role rename value 'tdv_staff' to 'agency_staff';
