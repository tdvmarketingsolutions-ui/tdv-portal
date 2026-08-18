"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import type { ProjectRequest } from "@/types/domain";
import { respondToProjectRequestPriceAction } from "./actions";

export function ProjectRequestPriceCard({ request }: { request: ProjectRequest }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  async function respond(accepted: boolean) {
    setLoading(accepted ? "accept" : "decline");
    const result = await respondToProjectRequestPriceAction(request.id, accepted);
    setLoading(null);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push(accepted ? "Bedankt! TDV bereidt de offerte voor." : "Aanvraag geweigerd.");
    router.refresh();
  }

  return (
    <li className="card space-y-3 border-accent/40 p-5">
      <div>
        <p className="font-medium">{request.title}</p>
        {request.description && (
          <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-dark-muted">{request.description}</p>
        )}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-canvas p-3 text-sm dark:bg-canvas-dark">
        <Sparkles size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="font-medium">Richtprijs: {request.indicative_price_range}</p>
          <p className="mt-0.5 text-ink-muted dark:text-ink-dark-muted">{request.indicative_price_note}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Wenst u door te gaan met deze richtprijs?</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => respond(false)} loading={loading === "decline"} disabled={loading !== null}>
            Niet akkoord
          </Button>
          <Button type="button" onClick={() => respond(true)} loading={loading === "accept"} disabled={loading !== null}>
            Akkoord
          </Button>
        </div>
      </div>
    </li>
  );
}
