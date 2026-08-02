import { Skeleton } from "@/components/ui/Skeleton";

export default function ContentItemLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-4 w-40" />
      <div>
        <Skeleton className="h-8 w-64" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
