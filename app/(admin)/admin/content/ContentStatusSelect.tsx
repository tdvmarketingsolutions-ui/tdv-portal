"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { CONTENT_STATUS_LABEL } from "@/lib/content-status";
import type { ContentStatus } from "@/types/domain";
import { updateContentItemStatusAction } from "./actions";

export function ContentStatusSelect({ contentItemId, status }: { contentItemId: string; status: ContentStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  useEffect(() => setOptimisticStatus(status), [status]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ContentStatus;
    const previous = optimisticStatus;
    setOptimisticStatus(next);

    const result = await updateContentItemStatusAction(contentItemId, next);
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
      {(Object.keys(CONTENT_STATUS_LABEL) as ContentStatus[]).map((s) => (
        <option key={s} value={s}>
          {CONTENT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
