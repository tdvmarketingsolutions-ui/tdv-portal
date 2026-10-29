import { Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

// Zelfde opbouw als AiAssistantClient: gesprekkenlijst links (vanaf md),
// chat rechts met het invoerveld onderaan, zodat er niets verspringt.
export default function AiAssistantLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 md:h-[calc(100vh-5rem)]">
      <div className="hidden w-64 shrink-0 flex-col gap-2 md:flex">
        <Skeleton className="mb-2 h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 pb-4">
          <Sparkles size={20} className="text-accent-text" />
          <h1 className="font-display text-h2 font-semibold sm:text-h1">ai-assistent.</h1>
        </header>
        <div className="flex-1 space-y-4 pb-4">
          <Skeleton className="h-[72px] w-full max-w-lg" />
        </div>
        <div className="flex gap-2 border-t border-border pt-4 dark:border-border-dark">
          <Skeleton className="h-[42px] flex-1 sm:h-[38px]" />
          <Skeleton className="h-[42px] w-12 sm:h-[38px]" />
        </div>
      </div>
    </div>
  );
}
