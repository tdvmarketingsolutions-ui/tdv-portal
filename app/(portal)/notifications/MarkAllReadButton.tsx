"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { markAllReadAction } from "./actions";

export function MarkAllReadButton() {
  const router = useRouter();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markAllReadAction();
    setLoading(false);

    if (result.error) {
      push(result.error, "error");
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleClick} loading={loading}>
      <CheckCheck size={16} strokeWidth={1.75} />
      Alles gelezen
    </Button>
  );
}
