import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Vul je e-mailadres in.").email("Vul een geldig e-mailadres in."),
  password: z.string().min(1, "Vul je wachtwoord in."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
