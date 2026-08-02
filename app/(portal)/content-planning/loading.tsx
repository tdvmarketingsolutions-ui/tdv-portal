import { Skeleton } from "@/components/ui/Skeleton";

export default function ContentPlanningLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  );
}
