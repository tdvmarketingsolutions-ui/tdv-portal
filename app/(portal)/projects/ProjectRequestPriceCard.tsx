"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { PROJECT_REQUEST_TYPE_LABEL } from "@/lib/project-request-status";
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
    push(accepted ? "Bedankt! TDV start de voorbereiding van je project." : "Aanvraag geweigerd.");
    router.refresh();
  }

  return (
    <li className="card space-y-3 border-accent/40 p-5">
      <div>
        <p className="font-medium">{request.title}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {request.project_type && <Badge tone="gray">{PROJECT_REQUEST_TYPE_LABEL[request.project_type]}</Badge>}
          {request.desired_deadline && (
            <Badge tone="gray">Gewenst tegen {new Date(request.desired_deadline).toLocaleDateString("nl-BE")}</Badge>
          )}
        </div>
        {request.description && (
          <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-dark-muted">{request.description}</p>
        )}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-canvas p-3 text-sm dark:bg-canvas-dark">
        <Sparkles size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="font-medium">Prijsvoorstel: {request.indicative_price_range}</p>
          <p className="mt-0.5 text-ink-muted dark:text-ink-dark-muted">{request.indicative_price_note}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted dark:text-ink-dark-muted">Wenst u door te gaan met dit prijsvoorstel?</p>
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
