"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { PROJECT_STATUS_LABEL } from "@/lib/project-status";
import type { ProjectStatus } from "@/types/domain";
import { updateProjectStatusAction } from "./actions";

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const router = useRouter();
  const { push } = useToast();
  // Optimistic: reflects the choice immediately instead of waiting on the
  // round-trip, then syncs back to the server value (itself kept in sync via
  // this same optimistic update on success, or a prop change from elsewhere).
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  useEffect(() => setOptimisticStatus(status), [status]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ProjectStatus;
    const previous = optimisticStatus;
    setOptimisticStatus(next);

    const result = await updateProjectStatusAction(projectId, next);
    if (result.error) {
      // Only roll back if the user hasn't already picked something newer
      // while this request was in flight.
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
      {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
        <option key={s} value={s}>
          {PROJECT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
