import { LoadingSkeleton, MetricSkeletonGrid } from "@/components/ui/loading-skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="대시보드" description="불러오는 중…" />
      <MetricSkeletonGrid count={4} />
      <LoadingSkeleton rows={4} />
    </div>
  );
}
