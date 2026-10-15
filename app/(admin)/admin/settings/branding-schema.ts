import { z } from "zod";

export const brandingSchema = z.object({
  brandName: z.string().trim().max(200).optional().or(z.literal("")),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Gebruik een hex-kleurcode, bv. #AF4B2F.")
    .optional()
    .or(z.literal("")),
  supportEmail: z.string().trim().email("Ongeldig e-mailadres.").optional().or(z.literal("")),
});

export type BrandingFormValues = z.infer<typeof brandingSchema>;
