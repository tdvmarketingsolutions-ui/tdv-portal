import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Ticket, TicketStatus } from "@/types/domain";

export interface AdminTicket extends Ticket {
  companies: { name: string } | null;
}

export async function getAllTicketsForAdmin(): Promise<AdminTicket[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, companies ( name )")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Kon tickets niet laden: ${error.message}`);
  return (data ?? []) as unknown as AdminTicket[];
}

export async function updateTicketStatusAdmin(ticketId: string, status: TicketStatus): Promise<void> {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };
  if (status === "resolved") updates.closed_at = new Date().toISOString();

  const { error } = await supabase.from("tickets").update(updates).eq("id", ticketId);
  if (error) throw new Error(`Kon ticketstatus niet bijwerken: ${error.message}`);
}
