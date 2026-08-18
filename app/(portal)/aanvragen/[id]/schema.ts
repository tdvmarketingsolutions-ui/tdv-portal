import { z } from "zod";

export const ticketMessageSchema = z.object({
  body: z.string().trim().min(1, "Vul een bericht in.").max(4000, "Bericht is te lang."),
});

export type TicketMessageFormValues = z.infer<typeof ticketMessageSchema>;
