import { z } from "zod";

const CHANNELS = ["instagram", "facebook", "linkedin", "tiktok", "blog", "email", "ads", "other"] as const;

export const newContentItemSchema = z.object({
  companyId: z.string().min(1, "Kies een klant."),
  title: z.string().trim().min(1, "Titel is verplicht.").max(200),
  caption: z.string().trim().max(2000).optional(),
  channels: z.array(z.enum(CHANNELS)).min(1, "Kies minstens één kanaal."),
  scheduledFor: z.string().optional(),
});

export type NewContentItemFormValues = z.infer<typeof newContentItemSchema>;

export const editContentItemSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht.").max(200),
  caption: z.string().trim().max(2000).optional(),
  channels: z.array(z.enum(CHANNELS)).min(1, "Kies minstens één kanaal."),
  scheduledFor: z.string().optional(),
});

export type EditContentItemFormValues = z.infer<typeof editContentItemSchema>;
