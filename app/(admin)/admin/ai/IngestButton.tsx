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
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await runKnowledgeBaseIngestAction();
    setLoading(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(result.message ?? "Kennisbank bijgewerkt.", "success");
    router.refresh();
  }

  return (
    <Button variant="secondary" size="sm" loading={loading} onClick={handleClick}>
      {!loading && <RefreshCw size={14} strokeWidth={1.75} />}
      Kennisbank-ingest nu draaien
    </Button>
  );
}
