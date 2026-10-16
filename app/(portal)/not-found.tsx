import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function PortalNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Pagina niet gevonden"
      description="Deze pagina bestaat niet (meer), of je hebt er geen toegang toe."
      action={
        <Link href="/dashboard" className="btn-primary">
          Naar dashboard
        </Link>
      }
    />
  );
}
