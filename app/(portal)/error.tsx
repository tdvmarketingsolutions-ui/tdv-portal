"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Server-side, Next.js already logs this; client-side (e.g. an action
  // throwing after the page rendered) this is the only record of it.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="Er ging iets mis"
      description="Deze pagina kon niet geladen worden. Probeer het opnieuw, of ga terug naar het dashboard."
      action={
        <div className="flex gap-2">
          <Button onClick={() => reset()}>Probeer opnieuw</Button>
          <Link href="/dashboard" className="btn-secondary">
            Naar dashboard
          </Link>
        </div>
      }
    />
  );
}
