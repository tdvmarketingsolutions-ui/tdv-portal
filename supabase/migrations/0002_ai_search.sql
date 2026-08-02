-- RPC used by app/api/ai/chat/route.ts. Runs with the caller's own
-- privileges (not security definer), and the company filter is a required
-- argument rather than inferred, so a query always has to say which tenant
-- it's searching — nothing to accidentally leave out.
create or replace function match_ai_documents(
  query_embedding vector(1536),
  match_company_id uuid,
  match_count int default 8
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql
stable
as $$
  select
    ai_documents.id,
    ai_documents.content,
    1 - (ai_documents.embedding <=> query_embedding) as similarity
  from ai_documents
  where ai_documents.company_id = match_company_id
  order by ai_documents.embedding <=> query_embedding
  limit match_count;
$$;
