/**
 * This file is a placeholder. Generate the real thing after linking your
 * Supabase project:
 *
 *   npx supabase login
 *   npx supabase link --project-ref <your-project-ref>
 *   npm run db:types
 *
 * Everything below is intentionally loose (`any`-ish via Record<string, unknown>)
 * so the app type-checks before that step, without masking the real shape
 * once generated types land here.
 *
 * The `Relationships: []` / `Args`/`Returns` fields below aren't optional
 * fluff — @supabase/postgrest-js's generic constraints (GenericTable /
 * GenericView / GenericFunction) require them to be present, even as empty
 * placeholders. Without them, TypeScript can't satisfy the constraint and
 * silently resolves every `.from()`/`.rpc()` call's row type to `never`,
 * which breaks `next build` (type errors) without ever explaining why.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type PlaceholderTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

type PlaceholderView = {
  Row: Record<string, unknown>;
  Relationships: [];
};

type PlaceholderFunction = {
  Args: Record<string, unknown>;
  Returns: unknown;
};

export interface Database {
  public: {
    Tables: Record<string, PlaceholderTable>;
    Views: Record<string, PlaceholderView>;
    Functions: Record<string, PlaceholderFunction>;
    Enums: Record<string, unknown>;
  };
}
