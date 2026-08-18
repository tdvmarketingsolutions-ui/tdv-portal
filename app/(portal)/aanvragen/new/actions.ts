"use server";

import { redirect } from "next/navigation";
import { createTicket } from "@/lib/data/tickets";
import { ticketSchema, type TicketFormValues } from "./schema";

export async function createTicketAction(
  input: TicketFormValues
): Promise<{ error: string } | never> {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Ongeldige gegevens — controleer het formulier." };
  }

  let ticketId: string;
  try {
    const ticket = await createTicket({
      subject: parsed.data.subject,
      priority: parsed.data.priority,
      projectId: parsed.data.projectId || undefined,
      firstMessage: parsed.data.firstMessage,
    });
    ticketId = ticket.id;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Kon aanvraag niet aanmaken." };
  }

  redirect(`/aanvragen/${ticketId}`);
}
