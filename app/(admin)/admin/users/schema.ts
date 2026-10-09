import { z } from "zod";

const ROLES = ["agency_admin", "agency_staff", "client_admin", "client_member"] as const;

export const inviteUserSchema = z
  .object({
    email: z.string().trim().email("Vul een geldig e-mailadres in."),
    role: z.enum(ROLES),
    companyId: z.string().optional(),
  })
  .refine((v) => v.role === "agency_admin" || v.role === "agency_staff" || !!v.companyId, {
    message: "Kies een klant voor deze rol.",
    path: ["companyId"],
  });

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export const editUserRoleSchema = z
  .object({
    role: z.enum(ROLES),
    companyId: z.string().optional(),
  })
  .refine((v) => v.role === "agency_admin" || v.role === "agency_staff" || !!v.companyId, {
    message: "Kies een klant voor deze rol.",
    path: ["companyId"],
  });

export type EditUserRoleFormValues = z.infer<typeof editUserRoleSchema>;
