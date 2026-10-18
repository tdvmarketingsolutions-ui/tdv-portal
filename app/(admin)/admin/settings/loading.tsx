import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminSettingsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-[220px] w-full" />
      <Skeleton className="h-[140px] w-full" />
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-[100px] w-full" />
    </div>
  );
}
