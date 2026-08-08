import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Vul je e-mailadres in.").email("Vul een geldig e-mailadres in."),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
