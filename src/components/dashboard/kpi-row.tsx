"use client";

import { MetricCard } from "@/components/ui/metric-card";
import { CurrencyDisplay } from "@/components/ui/currency-display";

export function KpiRow({
  totalAssets,
  totalDebt,
  netWorth,
  monthlyCashflow,
}: {
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
  monthlyCashflow: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="총자산">
        <CurrencyDisplay value={totalAssets} />
      </MetricCard>
      <MetricCard label="총부채">
        <CurrencyDisplay value={totalDebt} />
      </MetricCard>
      <MetricCard label="순자산">
        <CurrencyDisplay value={netWorth} />
      </MetricCard>
      <MetricCard label="월 현금흐름">
        <CurrencyDisplay value={monthlyCashflow} />
      </MetricCard>
    </div>
  );
}
