import type { FinanceSummary } from "@/domain/types";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/money";

export function HealthCard({ summary }: { summary: FinanceSummary }) {
  const rows = [
    { label: "유동성", value: summary.healthBreakdown.liquidity },
    { label: "부채", value: summary.healthBreakdown.debt },
    { label: "집중도", value: summary.healthBreakdown.concentration },
    { label: "현금흐름", value: summary.healthBreakdown.cashflow },
  ];

  return (
    <Card>
      <CardTitle>재무 건강</CardTitle>
      <CardDesc>
        점수 {summary.healthScore}/100 · 집중도 {formatPercent(summary.concentration)} · 비상금{" "}
        {summary.emergencyMonths === null ? "산출불가" : `${summary.emergencyMonths.toFixed(1)}개월`}
      </CardDesc>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{row.label}</span>
              <span className="tabular-nums">{row.value}</span>
            </div>
            <div className="h-2 rounded-full bg-[#EEF1F5]">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
