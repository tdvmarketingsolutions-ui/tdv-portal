"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { PROJECT_REQUEST_STATUS_LABEL } from "@/lib/project-request-status";
import type { ProjectRequestStatus } from "@/types/domain";
import { updateProjectRequestStatusAction } from "./actions";

export function ProjectRequestStatusSelect({ requestId, status }: { requestId: string; status: ProjectRequestStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ProjectRequestStatus;
    setLoading(true);
    const result = await updateProjectRequestStatusAction(requestId, next);
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
      className="rounded-lg border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent disabled:opacity-60 dark:border-border-dark dark:bg-surface-dark"
    >
      {(Object.keys(PROJECT_REQUEST_STATUS_LABEL) as ProjectRequestStatus[]).map((s) => (
        <option key={s} value={s}>
          {PROJECT_REQUEST_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
