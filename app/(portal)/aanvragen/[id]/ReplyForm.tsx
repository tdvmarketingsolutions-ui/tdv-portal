"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { ticketMessageSchema, type TicketMessageFormValues } from "./schema";
import { addTicketMessageAction } from "./actions";

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TicketMessageFormValues>({ resolver: zodResolver(ticketMessageSchema) });

  async function onSubmit(values: TicketMessageFormValues) {
    const result = await addTicketMessageAction(ticketId, values);
    if (result.error) {
      push(result.error, "error");
      return;
    }
    reset();
    push("Bericht geplaatst.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <Textarea
        label="Reageer"
        placeholder="Typ je antwoord…"
        rows={3}
        error={errors.body?.message}
        {...register("body")}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Versturen
        </Button>
      </div>
    </form>
  );
}
