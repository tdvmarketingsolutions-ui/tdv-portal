-- Performance: index every foreign key that's actually filtered or joined
-- on. Postgres does not auto-index foreign keys (unlike the primary key
-- side), and until now the only index in the whole schema was the pgvector
-- ivfflat one on ai_documents (0001). Every RLS policy written since 0001
-- leans on "company_id = current_company_id()" or an EXISTS join through
-- companies.agency_id, and that's run on every single select against these
-- tables — i.e. every dashboard, project, ticket, content-planning, files
-- and notifications page load was doing a sequential scan to enforce
-- tenant isolation. None of this changes behavior; it only changes how
-- Postgres gets to the same, already-correct answer.

-- The single most-repeated join in the whole RLS layer (0028): "exists
-- (select 1 from companies c where c.id = <table>.company_id and
-- c.agency_id = current_agency_id())" — appears on projects, tickets,
-- content_items, files, folders, project_requests, oauth_connections,
-- social_accounts, ai_conversations and every client-files storage policy.
create index if not exists companies_agency_id_idx on companies(agency_id);

create index if not exists projects_company_id_idx on projects(company_id);
create index if not exists project_timeline_events_project_id_idx on project_timeline_events(project_id);
create index if not exists project_comments_project_id_idx on project_comments(project_id);

create index if not exists tickets_company_id_idx on tickets(company_id);
create index if not exists ticket_messages_ticket_id_idx on ticket_messages(ticket_id);

create index if not exists files_company_id_idx on files(company_id);
create index if not exists files_folder_id_idx on files(folder_id);
create index if not exists folders_company_id_idx on folders(company_id);
create index if not exists folders_parent_id_idx on folders(parent_id);

create index if not exists deliverables_project_id_idx on deliverables(project_id);
create index if not exists deliverable_versions_deliverable_id_idx on deliverable_versions(deliverable_id);
create index if not exists deliverable_comments_deliverable_version_id_idx on deliverable_comments(deliverable_version_id);

create index if not exists content_items_company_id_idx on content_items(company_id);
create index if not exists content_item_comments_content_item_id_idx on content_item_comments(content_item_id);

-- Checked on literally every portal/admin page load (unread-count badge +
-- notification bell), so this is the single highest-frequency query in the
-- app that had no index at all.
create index if not exists notifications_recipient_id_idx on notifications(recipient_id);

create index if not exists project_requests_company_id_idx on project_requests(company_id);
create index if not exists oauth_connections_company_id_idx on oauth_connections(company_id);
create index if not exists social_accounts_company_id_idx on social_accounts(company_id);
create index if not exists ai_conversations_company_id_idx on ai_conversations(company_id);

-- ai_chat_messages/activity_log carry a denormalized agency_id (0025) read
-- directly by RLS instead of joining through companies — index both the
-- denormalized column and the regular company_id filter.
create index if not exists ai_chat_messages_company_id_idx on ai_chat_messages(company_id);
create index if not exists ai_chat_messages_agency_id_idx on ai_chat_messages(agency_id);
create index if not exists ai_chat_messages_conversation_id_idx on ai_chat_messages(conversation_id);
create index if not exists activity_log_company_id_idx on activity_log(company_id);
create index if not exists activity_log_agency_id_idx on activity_log(agency_id);

-- match_ai_documents (0028) filters on both before the vector search even
-- starts — the ivfflat index (0001) only covers the embedding column.
create index if not exists ai_documents_company_id_idx on ai_documents(company_id);
create index if not exists ai_documents_agency_id_idx on ai_documents(agency_id);
