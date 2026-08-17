-- Per-user opt-out for email notifications. In-app notifications (the bell/
-- list) always get created regardless of this flag — it only gates whether
-- createNotifications() also sends an email for that row.
alter table profiles add column email_notifications boolean not null default true;
