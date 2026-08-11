"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="종합 재물운 오류"
      description="데이터를 불러오는 중 문제가 발생했습니다."
      onRetry={reset}
    />
  );
}
