import "server-only";
import { cookies } from "next/headers";

export const STAFF_VIEW_COOKIE = "staff_view_company_id";

export function isStaffRole(role: string | null | undefined): boolean {
  return role === "tdv_admin" || role === "tdv_staff";
}

/**
 * The company a staff member picked via the sidebar "Bekijk als klant"
 * switcher (components/layout/StaffViewSwitcher.tsx), if any.
 */
export function getStaffViewCompanyId(): string | null {
  return cookies().get(STAFF_VIEW_COOKIE)?.value ?? null;
}

// `role`/`company_id` come in as `unknown` from most call sites: the real
// `types/database.types.ts` is still a placeholder (see CLAUDE.md), so a
// `.select("role, company_id")` doesn't get properly typed columns yet.
type ViewerProfile = { role: unknown; company_id: unknown } | null;

/**
 * Which company_id (if any) a client-facing *list* query should additionally
 * be filtered to. Clients are never touched here — RLS already scopes them
 * to their own company, and CLAUDE.md's core rule stands: application code
 * never adds its own company_id filter for a client based on anything. Staff
 * get an *extra*, optional narrowing on top of what they can already see —
 * RLS grants staff full read access regardless of this cookie, so a
 * missing/tampered value can only ever make staff see LESS than usual, never
 * more.
 */
export function resolveListFilterCompanyId(profile: ViewerProfile): string | null {
  if (profile?.company_id) return null;
  if (!isStaffRole(profile?.role as string | null | undefined)) return null;
  return getStaffViewCompanyId();
}

/**
 * Which company_id a client-facing *create* (e.g. createProjectRequest,
 * createTicket) should write against. Clients always use their own
 * profile.company_id, unchanged. Staff have no company of their own, so they
 * fall back to the "Bekijk als klant" cookie — this only wires up a UI path
 * to a write staff could already make: every client-insert RLS policy in
 * this schema is `is_tdv_staff() or company_id = current_company_id()`, so
 * staff can already insert for any company_id regardless of this cookie.
 */
export function resolveWriteCompanyId(profile: ViewerProfile): string | null {
  if (profile?.company_id) return profile.company_id as string;
  if (!isStaffRole(profile?.role as string | null | undefined)) return null;
  return getStaffViewCompanyId();
}
