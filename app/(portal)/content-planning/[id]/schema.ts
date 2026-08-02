import { z } from "zod";

export const contentCommentSchema = z.object({
  body: z.string().trim().min(1, "Vul een opmerking in.").max(4000, "Opmerking is te lang."),
});

export type ContentCommentFormValues = z.infer<typeof contentCommentSchema>;
