import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketPriority } from "@/types/domain";

export async function getTicketsForCurrentUser(): Promise<Ticket[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon tickets niet laden: ${error.message}`);
  return (data ?? []) as unknown as Ticket[];
}

export async function createTicket(input: {
  subject: string;
  priority: TicketPriority;
  projectId?: string;
  firstMessage: string;
}) {
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

  if (ticketError) throw new Error(`Kon ticket niet aanmaken: ${ticketError.message}`);

  const { error: messageError } = await supabase
    .from("ticket_messages")
    .insert({ ticket_id: ticket.id, author_id: user.id, body: input.firstMessage });

  if (messageError) throw new Error(`Kon eerste bericht niet opslaan: ${messageError.message}`);

  return ticket;
}
