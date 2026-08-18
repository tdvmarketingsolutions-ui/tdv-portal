import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createNotifications } from "@/lib/data/notifications";
import { generateIndicativePrice } from "@/lib/ai/indicative-price";
import { resolveListFilterCompanyId, resolveWriteCompanyId } from "@/lib/staff-view";
import type { ProjectRequest } from "@/types/domain";

export async function getProjectRequestsForCurrentUser(): Promise<ProjectRequest[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role, company_id").eq("id", user.id).single()
    : { data: null };
  const viewCompanyId = resolveListFilterCompanyId(profile);

  let query = supabase.from("project_requests").select("*").order("created_at", { ascending: false });
  if (viewCompanyId) query = query.eq("company_id", viewCompanyId);

  const { data, error } = await query;
  if (error) throw new Error(`Kon projectaanvragen niet laden: ${error.message}`);
  return (data ?? []) as unknown as ProjectRequest[];
}

/**
 * No companyId parameter — resolves it from the caller's own profile, same
 * pattern as createTicket/createContentItemForCurrentUser. Matches the
 * project_requests_insert policy (migration 0015), which only allows a
 * client to insert a row for their own company_id. Staff with no company of
 * their own fall back to their "Bekijk als klant" pick (lib/staff-view.ts).
 *
 * The AI indicative price (migration 0016) is generated right after the
 * insert and is best-effort: if it fails, the row is simply left with
 * price_response 'pending' and no range — the client sees a plain "wacht op
 * offerte" status instead of a price prompt, and staff proceeds manually.
 */
export async function createProjectRequest(input: { title: string; description?: string }): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();
  const companyId = resolveWriteCompanyId(profile);
  if (!companyId) throw new Error("Geen bedrijf gekoppeld aan dit account.");

  const { data: inserted, error } = await supabase
    .from("project_requests")
    .insert({
      company_id: companyId,
      title: input.title,
      description: input.description ?? null,
      requested_by: user.id,
    })
    .select("id")
    .single();
  if (error || !inserted) throw new Error(`Kon projectaanvraag niet versturen: ${error?.message}`);

  const { data: staff } = await supabase.from("profiles").select("id").in("role", ["tdv_admin", "tdv_staff"]);
  await createNotifications(
    ((staff ?? []) as { id: string }[]).map((s) => ({
      recipientId: s.id,
      type: "approval",
      title: `Nieuwe projectaanvraag: ${input.title}`,
      body: input.description,
      linkPath: "/admin/projects",
    }))
  );

  const indicativePrice = await generateIndicativePrice(input.title, input.description);
  if (indicativePrice) {
    await supabase
      .from("project_requests")
      .update({ indicative_price_range: indicativePrice.range, indicative_price_note: indicativePrice.note })
      .eq("id", (inserted as { id: string }).id);
  }
}

/**
 * Writes through the respond_to_project_request_price RPC (migration 0016)
 * rather than a direct .update() — see that migration for why a plain client
 * UPDATE policy isn't safe here. Notifies staff either way: accepted means
 * "go prepare the real quote", declined means the request is dead and staff
 * shouldn't keep working on it.
 */
export async function respondToProjectRequestPrice(requestId: string, accepted: boolean): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("respond_to_project_request_price", { request_id: requestId, accepted });
  if (error) throw new Error(`Kon niet reageren op de richtprijs: ${error.message}`);

  const { data: requestData } = await supabase.from("project_requests").select("title").eq("id", requestId).single();
  const title = (requestData as { title: string } | null)?.title ?? "een projectaanvraag";

  const { data: staff } = await supabase.from("profiles").select("id").in("role", ["tdv_admin", "tdv_staff"]);
  await createNotifications(
    ((staff ?? []) as { id: string }[]).map((s) => ({
      recipientId: s.id,
      type: "approval",
      title: `Richtprijs ${accepted ? "geaccepteerd" : "geweigerd"}: ${title}`,
      body: accepted
        ? "De klant ging akkoord met de richtprijs — bereid de offerte voor."
        : "De klant ging niet akkoord met de richtprijs. De aanvraag is geweigerd.",
      linkPath: "/admin/projects",
    }))
  );
}
