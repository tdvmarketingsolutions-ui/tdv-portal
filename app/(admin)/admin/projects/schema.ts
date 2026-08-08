import { z } from "zod";

export const newProjectSchema = z.object({
  companyId: z.string().min(1, "Kies een klant."),
  name: z.string().trim().min(1, "Naam is verplicht.").max(200),
  description: z.string().trim().max(2000).optional(),
  deadline: z.string().optional(),
});

export type NewProjectFormValues = z.infer<typeof newProjectSchema>;
