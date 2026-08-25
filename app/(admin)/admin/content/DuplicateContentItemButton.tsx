"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { duplicateContentItemAction } from "./actions";

export function DuplicateContentItemButton({ contentItemId, title }: { contentItemId: string; title: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await duplicateContentItemAction(contentItemId);
    setLoading(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(`"${title}" gedupliceerd — kopie staat bij "Nog niet ingepland".`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={`${title} dupliceren`}
      className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-60 dark:text-ink-dark-muted dark:hover:bg-canvas-dark dark:hover:text-ink-dark"
    >
      <Copy size={15} strokeWidth={1.75} />
    </button>
  );
}
