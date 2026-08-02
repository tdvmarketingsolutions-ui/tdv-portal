import { z } from "zod";

export const ticketSchema = z.object({
  subject: z.string().trim().min(1, "Onderwerp is verplicht.").max(200, "Onderwerp is te lang."),
  priority: z.enum(["low", "normal", "high", "urgent"], {
    required_error: "Kies een prioriteit.",
  }),
  projectId: z.string().optional(),
  firstMessage: z.string().trim().min(1, "Beschrijf je vraag of probleem.").max(4000, "Bericht is te lang."),
});

export type TicketFormValues = z.infer<typeof ticketSchema>;
