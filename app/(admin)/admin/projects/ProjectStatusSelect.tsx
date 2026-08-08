"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { PROJECT_STATUS_LABEL } from "@/lib/project-status";
import type { ProjectStatus } from "@/types/domain";
import { updateProjectStatusAction } from "./actions";

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ProjectStatus;
    setLoading(true);
    const result = await updateProjectStatusAction(projectId, next);
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
      {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
        <option key={s} value={s}>
          {PROJECT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
