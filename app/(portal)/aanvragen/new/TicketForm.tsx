"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { ticketSchema, type TicketFormValues } from "./schema";
import { createTicketAction } from "./actions";
import type { Project } from "@/types/domain";

export function TicketForm({ projects }: { projects: Pick<Project, "id" | "name">[] }) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { priority: "normal", projectId: "" },
  });

  async function onSubmit(values: TicketFormValues) {
    const result = await createTicketAction(values);
    if (result?.error) {
      push(result.error, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6" noValidate>
      <Input label="Onderwerp" placeholder="Waar gaat het over?" error={errors.subject?.message} {...register("subject")} />

      <Select label="Prioriteit" error={errors.priority?.message} {...register("priority")}>
        <option value="low">Laag</option>
        <option value="normal">Normaal</option>
        <option value="high">Hoog</option>
        <option value="urgent">Urgent</option>
      </Select>

      {projects.length > 0 && (
        <Select label="Project (optioneel)" hint="Koppel deze aanvraag aan een lopend project." {...register("projectId")}>
          <option value="">Geen project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      )}

      <Textarea
        label="Bericht"
        placeholder="Beschrijf je vraag of probleem zo concreet mogelijk."
        rows={5}
        error={errors.firstMessage?.message}
        {...register("firstMessage")}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Aanvraag versturen
        </Button>
      </div>
    </form>
  );
}
