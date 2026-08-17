import { z } from "zod";

export const editProfileSchema = z.object({
  fullName: z.string().trim().min(1, "Naam is verplicht.").max(200),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten."),
    confirmPassword: z.string().min(1, "Bevestig je wachtwoord."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
