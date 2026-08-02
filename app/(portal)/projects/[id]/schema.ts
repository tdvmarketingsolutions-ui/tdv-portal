import { z } from "zod";

export const projectCommentSchema = z.object({
  body: z.string().trim().min(1, "Vul een opmerking in.").max(4000, "Opmerking is te lang."),
});

export type ProjectCommentFormValues = z.infer<typeof projectCommentSchema>;
