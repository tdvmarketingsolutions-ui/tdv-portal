-- Pin search_path on SECURITY DEFINER (and other) helper functions so they
-- can't be hijacked by objects created earlier in a mutable search_path.
alter function public.is_tdv_staff() set search_path = public;
alter function public.current_company_id() set search_path = public;
alter function public.match_ai_documents(vector, uuid, int) set search_path = public;
