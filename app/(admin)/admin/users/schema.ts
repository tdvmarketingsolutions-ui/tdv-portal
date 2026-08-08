import { z } from "zod";

const ROLES = ["tdv_admin", "tdv_staff", "client_admin", "client_member"] as const;

export const inviteUserSchema = z
  .object({
    email: z.string().trim().email("Vul een geldig e-mailadres in."),
    role: z.enum(ROLES),
    companyId: z.string().optional(),
  })
  .refine((v) => v.role === "tdv_admin" || v.role === "tdv_staff" || !!v.companyId, {
    message: "Kies een klant voor deze rol.",
    path: ["companyId"],
  });

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export const editUserRoleSchema = z
  .object({
    role: z.enum(ROLES),
    companyId: z.string().optional(),
  })
  .refine((v) => v.role === "tdv_admin" || v.role === "tdv_staff" || !!v.companyId, {
    message: "Kies een klant voor deze rol.",
    path: ["companyId"],
  });

export type EditUserRoleFormValues = z.infer<typeof editUserRoleSchema>;
