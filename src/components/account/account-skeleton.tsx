import { Skeleton } from "@/components/ui/skeleton";

export function AccountSkeleton() {
  return (
    <div role="status" aria-label="Loading your account" className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
