import { z } from "zod";

export const deliverableCommentSchema = z.object({
  body: z.string().trim().min(1, "Vul een opmerking in.").max(4000, "Opmerking is te lang."),
  anchorX: z.number().min(0).max(100).optional(),
  anchorY: z.number().min(0).max(100).optional(),
});

export type DeliverableCommentFormValues = z.infer<typeof deliverableCommentSchema>;
