import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminAiLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <Skeleton className="h-[88px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px] w-full" />
        ))}
      </div>
    </div>
  );
}
