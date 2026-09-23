"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { activateCompanyAction } from "../actions";

export function ActivateCompanyButton({ companyId }: { companyId: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleActivate() {
    setLoading(true);
    const result = await activateCompanyAction(companyId);
    setLoading(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    push("Klant geactiveerd.");
    router.refresh();
  }

  return (
    <Button type="button" size="sm" loading={loading} onClick={handleActivate}>
      {!loading && <CheckCircle2 size={14} strokeWidth={1.75} />}
      Activeren
    </Button>
  );
}
