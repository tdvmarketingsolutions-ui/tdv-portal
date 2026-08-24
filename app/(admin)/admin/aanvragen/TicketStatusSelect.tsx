"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { TICKET_STATUS_LABEL } from "@/lib/ticket-status";
import type { TicketStatus } from "@/types/domain";
import { updateTicketStatusAction } from "./actions";

export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: TicketStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TicketStatus;
    setLoading(true);
    const result = await updateTicketStatusAction(ticketId, next);
    setLoading(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className="rounded-lg border border-border bg-surface px-2 py-1 text-base outline-none focus:border-accent disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark md:text-xs"
    >
      {(Object.keys(TICKET_STATUS_LABEL) as TicketStatus[]).map((s) => (
        <option key={s} value={s}>
          {TICKET_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
