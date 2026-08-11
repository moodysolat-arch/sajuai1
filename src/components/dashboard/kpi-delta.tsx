"use client";

import type { MomDelta } from "@/domain/dashboard";
import { formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

export function KpiDelta({ mom }: { mom: MomDelta | null | undefined }) {
  if (!mom) return null;

  const positive = mom.delta > 0;
  const negative = mom.delta < 0;
  const pctLabel =
    mom.deltaPct == null ? "전월 대비" : `전월 대비 ${formatPercent(Math.abs(mom.deltaPct))}`;

  return (
    <p
      className={cn(
        "mt-1 text-xs tabular-nums",
        positive && "text-positive",
        negative && "text-danger",
        !positive && !negative && "text-ink/45",
      )}
    >
      {positive ? "▲" : negative ? "▼" : "–"} {pctLabel}
    </p>
  );
}
