"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { TICKET_STATUS_LABEL } from "@/lib/ticket-status";
import type { TicketStatus } from "@/types/domain";
import { updateTicketStatusAction } from "./actions";

export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: TicketStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  useEffect(() => setOptimisticStatus(status), [status]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TicketStatus;
    const previous = optimisticStatus;
    setOptimisticStatus(next);

    const result = await updateTicketStatusAction(ticketId, next);
    if (result.error) {
      setOptimisticStatus((current) => (current === next ? previous : current));
      push(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <select
      value={optimisticStatus}
      onChange={handleChange}
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
