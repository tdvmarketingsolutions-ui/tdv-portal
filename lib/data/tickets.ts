import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createNotifications } from "@/lib/data/notifications";
import type { Ticket, TicketPriority, TicketWithMessages } from "@/types/domain";

export async function getTicketsForCurrentUser(): Promise<Ticket[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon aanvragen niet laden: ${error.message}`);
  return (data ?? []) as unknown as Ticket[];
}

export async function createTicket(input: {
  subject: string;
  priority: TicketPriority;
  projectId?: string;
  firstMessage: string;
}): Promise<Ticket> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile?.company_id) throw new Error("Geen bedrijf gekoppeld aan dit account.");

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      company_id: profile.company_id,
      project_id: input.projectId ?? null,
      subject: input.subject,
      priority: input.priority,
      created_by: user.id,
    })
    .select()
    .single();

  if (ticketError) throw new Error(`Kon aanvraag niet aanmaken: ${ticketError.message}`);

  const { error: messageError } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: ticket.id, author_id: user.id, body: input.firstMessage });

  if (messageError) throw new Error(`Kon eerste bericht niet opslaan: ${messageError.message}`);

  // New requests have no assignee yet, so there's no single staff recipient
  // to notify — tell everyone on TDV's side instead, same as an unassigned
  // request showing up in /admin/aanvragen for anyone to pick up.
  const { data: staff } = await supabase.from("profiles").select("id").in("role", ["tdv_admin", "tdv_staff"]);
  await createNotifications(
    ((staff ?? []) as { id: string }[]).map((s) => ({
      recipientId: s.id,
      type: "ticket",
      title: `Nieuwe aanvraag: ${input.subject}`,
      body: input.firstMessage,
      linkPath: `/aanvragen/${ticket.id}`,
    }))
  );

  return ticket as unknown as Ticket;
}

export async function getTicketById(ticketId: string): Promise<TicketWithMessages | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(`*, ticket_messages (*, profiles ( full_name, avatar_url ))`)
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw new Error(`Kon aanvraag niet laden: ${error.message}`);
  return data as unknown as TicketWithMessages | null;
}

export async function addTicketMessage(ticketId: string, body: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const { error } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: ticketId, author_id: user.id, body });

  if (error) throw new Error(`Kon bericht niet plaatsen: ${error.message}`);

  const { data: ticketData } = await supabase
    .from("tickets")
    .select("subject, created_by, assigned_to")
    .eq("id", ticketId)
    .single();
  const ticket = ticketData as { subject: string; created_by: string; assigned_to: string | null } | null;
  if (!ticket) return;

  // Notify whichever side didn't just write this message — the client who
  // opened the request, or the staff member it's assigned to. No assignee
  // yet means nobody to notify, same as at creation time.
  const recipientId = user.id === ticket.created_by ? ticket.assigned_to : ticket.created_by;
  if (recipientId) {
    await createNotifications([
      {
        recipientId,
        type: "ticket" as const,
        title: `Nieuw bericht bij aanvraag "${ticket.subject}"`,
        body,
        linkPath: `/aanvragen/${ticketId}`,
      },
    ]);
  }
}
