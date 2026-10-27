import Link from "next/link";
import { SearchX } from "lucide-react";

// Catches unmatched routes outside the (portal)/(admin) trees (which have
// their own not-found.tsx pointing back into the app) — e.g. a typo'd URL
// hit before a session even exists, so this can't assume one.
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft dark:bg-accent/10">
        <SearchX size={22} strokeWidth={1.75} className="text-accent-text" />
      </div>
      <div>
        <p className="font-medium">Pagina niet gevonden</p>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-dark-muted">
          Deze pagina bestaat niet (meer).
        </p>
      </div>
      <Link href="/login" className="btn-primary">
        Naar inloggen
      </Link>
    </div>
  );
}
