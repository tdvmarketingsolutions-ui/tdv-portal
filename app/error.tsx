"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Catches errors that occur above the (portal)/(admin) route groups —
// e.g. in the root layout's own rendering — so a crash there never falls
// through to Next.js's default unstyled error screen. Errors inside the
// portal/admin trees are caught closer to the source by their own
// error.tsx, which can link back into the app; this one can't assume
// the sidebar/session context still works, so it only offers a reload.
export default function RootError({
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft dark:bg-danger-soft-dark">
        <AlertTriangle size={22} strokeWidth={1.75} className="text-danger dark:text-danger-dark" />
      </div>
      <div>
        <p className="font-medium">Er ging iets mis</p>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Deze pagina kon niet geladen worden. Probeer het opnieuw.
        </p>
      </div>
      <Button onClick={() => reset()}>Probeer opnieuw</Button>
    </div>
  );
}
