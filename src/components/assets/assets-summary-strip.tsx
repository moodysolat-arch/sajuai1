"use client";

import { AllocationChart } from "@/components/charts/allocation-chart";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import type { FinanceSummary } from "@/domain/types";
import { formatPercent } from "@/lib/money";

export function AssetsSummaryStrip({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="총자산">
          <CurrencyDisplay value={summary.totalAssets} />
        </MetricCard>
        <MetricCard label="총부채">
          <CurrencyDisplay value={summary.totalDebt} />
        </MetricCard>
        <MetricCard label="순자산">
          <CurrencyDisplay value={summary.netWorth} />
        </MetricCard>
        <MetricCard
          label="재무 건강 점수"
          hint={`유동성 ${summary.healthBreakdown.liquidity} · 부채 ${summary.healthBreakdown.debt} · 집중 ${summary.healthBreakdown.concentration} · 현금흐름 ${summary.healthBreakdown.cashflow}`}
        >
          {summary.healthScore}
          <span className="text-base font-normal text-ink/45"> / 100</span>
        </MetricCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <MetricCard label="월 순현금흐름">
          <CurrencyDisplay value={summary.monthlyCashflow} />
        </MetricCard>
        <MetricCard label="최대 자산군 집중도">
          {formatPercent(summary.concentration)}
        </MetricCard>
        <MetricCard label="비상자금 개월 수">
          {summary.emergencyMonths == null
            ? "—"
            : `${summary.emergencyMonths.toFixed(1)}개월`}
        </MetricCard>
      </div>

      <Card className="p-4">
        <CardTitle>자산 구성비</CardTitle>
        <CardDesc>유형별 평가액 비중</CardDesc>
        <div className="mt-4 min-w-0">
          <AllocationChart allocation={summary.allocation} />
        </div>
      </Card>
    </div>
  );
}
