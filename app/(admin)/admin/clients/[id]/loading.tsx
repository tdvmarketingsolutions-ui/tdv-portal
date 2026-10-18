import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminClientDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-36" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[160px] w-full md:col-span-2" />
      </div>
    </div>
  );
}
