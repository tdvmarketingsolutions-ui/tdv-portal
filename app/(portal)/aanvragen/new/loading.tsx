import { Skeleton } from "@/components/ui/Skeleton";

export default function NewTicketLoading() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">nieuwe aanvraag.</h1>
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </header>
      {/* onderwerp, prioriteit, project, bericht, verzendknop */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-[42px] w-full sm:h-[38px]" />
          </div>
        ))}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}
