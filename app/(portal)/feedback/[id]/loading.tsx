import { Skeleton } from "@/components/ui/Skeleton";

export default function FeedbackDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-4 w-36" />
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <Skeleton className="h-80 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
