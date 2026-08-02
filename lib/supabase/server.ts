import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Always create a fresh instance per request — never module-scope this.
 *
 * RLS note: this client carries the signed-in user's JWT, so every query
 * automatically respects the row-level security policies defined in
 * supabase/migrations/0001_init.sql. Tenant isolation lives in the database,
 * not in application code — do not "trust" a company_id passed from the
 * client without RLS backing it up.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore because
            // middleware refreshes the session on every request anyway.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Same as above.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. ONLY use this in trusted
 * server-side contexts (admin portal route handlers, cron jobs, webhooks)
 * that have already verified the caller is a TDV staff member — this
 * client bypasses RLS entirely.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
