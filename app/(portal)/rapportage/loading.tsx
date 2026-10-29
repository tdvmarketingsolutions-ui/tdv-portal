import { Skeleton } from "@/components/ui/Skeleton";

// De maandcijfers worden uit meerdere tabellen samengeteld: de titel staat
// er meteen, de cijfers volgen.
export default function RapportageLoading() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-h2 font-semibold sm:text-h1">rapportage.</h1>
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[108px] w-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-56" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px] w-full" />
        ))}
      </div>
    </div>
  );
}
