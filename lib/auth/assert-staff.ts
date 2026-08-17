import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Throws "NOT_AUTHORIZED" unless the caller is signed in as TDV staff.
 * Shared by data-layer functions that are reachable from more than one
 * route — some behind /admin (already gated by app/(admin)/admin/layout.tsx's
 * role check), some behind /content-planning (a regular portal route, not
 * staff-gated at all). A function callable from an ungated route can't rely
 * on "the page already checked" — it has to check itself.
 */
export async function assertTdvStaff(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("NOT_AUTHORIZED");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "tdv_admin" && profile?.role !== "tdv_staff") {
    throw new Error("NOT_AUTHORIZED");
  }
}
