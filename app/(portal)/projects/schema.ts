import { z } from "zod";

export const newProjectRequestSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht.").max(200),
  description: z.string().trim().max(2000).optional(),
});

export type NewProjectRequestFormValues = z.infer<typeof newProjectRequestSchema>;
