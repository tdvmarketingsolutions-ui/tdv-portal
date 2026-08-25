import { z } from "zod";

const PROJECT_REQUEST_TYPES = ["website", "branding", "social_media", "seo_sea", "video", "other"] as const;
const BUDGET_INDICATIONS = ["under_1000", "from_1000_to_3000", "from_3000_to_7000", "over_7000", "unknown"] as const;

export const newProjectRequestSchema = z.object({
  title: z.string().trim().min(1, "Titel is verplicht.").max(200),
  projectType: z.enum(PROJECT_REQUEST_TYPES, { errorMap: () => ({ message: "Kies het type project." }) }),
  budgetIndication: z.enum(BUDGET_INDICATIONS, { errorMap: () => ({ message: "Kies een budget-indicatie." }) }),
  description: z.string().trim().max(2000).optional(),
  desiredDeadline: z.string().optional(),
});

export type NewProjectRequestFormValues = z.infer<typeof newProjectRequestSchema>;
