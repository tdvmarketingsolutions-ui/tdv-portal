/**
 * This file is a placeholder. Generate the real thing after applying the
 * migration and linking your Supabase project:
 *
 *   npx supabase login
 *   npx supabase link --project-ref <your-project-ref>
 *   npm run db:types
 *
 * Everything below is intentionally loose (`any`-ish via Record<string, unknown>)
 * so the app type-checks before that step, without masking the real shape
 * once generated types land here.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
