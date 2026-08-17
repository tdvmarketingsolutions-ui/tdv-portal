"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { CONTENT_STATUS_LABEL } from "@/lib/content-status";
import type { ContentStatus } from "@/types/domain";
import { updateContentItemStatusAction } from "./actions";

export function ContentStatusSelect({ contentItemId, status }: { contentItemId: string; status: ContentStatus }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as ContentStatus;
    setLoading(true);
    const result = await updateContentItemStatusAction(contentItemId, next);
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
      {(Object.keys(CONTENT_STATUS_LABEL) as ContentStatus[]).map((s) => (
        <option key={s} value={s}>
          {CONTENT_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
