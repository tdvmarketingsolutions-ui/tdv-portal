import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Vul je naam in.").max(200),
    companyName: z.string().trim().min(1, "Vul je bedrijfsnaam in.").max(200),
    email: z.string().trim().min(1, "Vul je e-mailadres in.").email("Vul een geldig e-mailadres in."),
    password: z.string().min(8, "Wachtwoord moet minstens 8 tekens bevatten."),
    confirmPassword: z.string().min(1, "Bevestig je wachtwoord."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Wachtwoorden komen niet overeen.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
