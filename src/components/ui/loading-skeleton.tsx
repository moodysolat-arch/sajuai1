import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">불러오는 중</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-[12px] border border-border bg-muted"
        />
      ))}
    </div>
  );
}

export function MetricSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
      <span className="sr-only">지표 불러오는 중</span>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-[12px] border border-border bg-muted"
        />
      ))}
    </div>
  );
}
