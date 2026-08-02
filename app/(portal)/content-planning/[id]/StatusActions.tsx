"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { updateContentStatusAction } from "./actions";

export function StatusActions({ contentItemId }: { contentItemId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState<"approve" | "revision" | null>(null);

  async function handle(status: "approved" | "draft", which: "approve" | "revision") {
    setLoading(which);
    const result = await updateContentStatusAction(contentItemId, status);
    setLoading(null);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(status === "approved" ? "Content goedgekeurd." : "Revisie aangevraagd.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => handle("approved", "approve")} loading={loading === "approve"} disabled={loading === "revision"}>
        <Check size={16} strokeWidth={1.75} />
        Goedkeuren
      </Button>
      <Button
        variant="secondary"
        onClick={() => handle("draft", "revision")}
        loading={loading === "revision"}
        disabled={loading === "approve"}
      >
        <RotateCcw size={16} strokeWidth={1.75} />
        Revisie aanvragen
      </Button>
    </div>
  );
}
