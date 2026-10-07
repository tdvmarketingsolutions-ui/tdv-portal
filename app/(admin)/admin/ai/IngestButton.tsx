"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { runKnowledgeBaseIngestAction } from "./actions";

export function IngestButton() {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState<"incremental" | "full" | null>(null);

  async function handleClick(fullResync: boolean) {
    setLoading(fullResync ? "full" : "incremental");
    const result = await runKnowledgeBaseIngestAction({ fullResync });
    setLoading(null);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(result.message ?? "Kennisbank bijgewerkt.", "success");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" size="sm" loading={loading === "incremental"} onClick={() => handleClick(false)}>
        {!loading && <RefreshCw size={14} strokeWidth={1.75} />}
        Kennisbank bijwerken
      </Button>
      <button
        type="button"
        onClick={() => handleClick(true)}
        disabled={loading !== null}
        title="Herembedt alles, ook ongewijzigde data — gebruik dit af en toe om statuswijzigingen op deliverable-versies en verwijderde bronnen mee te nemen (die de incrementele update mist)."
        className="text-xs text-ink-muted underline-offset-2 hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-ink-dark-muted dark:hover:text-ink-dark"
      >
        {loading === "full" ? "Bezig…" : "Volledig herbouwen"}
      </button>
    </div>
  );
}
