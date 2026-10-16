"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Er ging iets mis"
      description="Deze pagina kon niet geladen worden. Probeer het opnieuw, of ga terug naar klanten."
      action={
        <div className="flex gap-2">
          <Button onClick={() => reset()}>Probeer opnieuw</Button>
          <Link href="/admin/clients" className="btn-secondary">
            Naar klanten
          </Link>
        </div>
      }
    />
  );
}
