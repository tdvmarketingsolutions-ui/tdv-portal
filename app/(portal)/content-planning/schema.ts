import { z } from "zod";

const CHANNELS = ["instagram", "facebook", "linkedin", "tiktok", "blog", "email", "ads", "other"] as const;

export const newContentItemSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht.").max(200),
  caption: z.string().trim().max(2000).optional(),
  channel: z.enum(CHANNELS),
  scheduledFor: z.string().optional(),
});

export type NewContentItemFormValues = z.infer<typeof newContentItemSchema>;
