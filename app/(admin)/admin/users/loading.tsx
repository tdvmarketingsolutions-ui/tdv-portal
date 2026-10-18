import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] w-full" />
        ))}
      </div>
    </div>
  );
}
