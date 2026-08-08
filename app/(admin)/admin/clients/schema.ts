import { z } from "zod";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const companySchema = z.object({
  name: z.string().trim().min(1, "Naam is verplicht.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is verplicht.")
    .transform(slugify)
    .refine((v) => v.length > 0, "Ongeldige slug."),
});

export type CompanyFormValues = z.infer<typeof companySchema>;
