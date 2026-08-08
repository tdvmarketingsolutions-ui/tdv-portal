import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten."),
    confirmPassword: z.string().min(1, "Bevestig je wachtwoord."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
