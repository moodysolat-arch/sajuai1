"use client";

import { formatKrw, toWon, type MoneyInput } from "@/lib/money";
import { useMask } from "@/components/layout/mask-context";
import { cn } from "@/lib/utils";

export function CurrencyDisplay({
  value,
  compact,
  className,
  forceMasked,
}: {
  value: MoneyInput;
  compact?: boolean;
  className?: string;
  forceMasked?: boolean;
}) {
  const { masked } = useMask();
  const hide = forceMasked ?? masked;
  return (
    <span className={cn("tabular-nums", className)}>
      {formatKrw(toWon(value), { compact, masked: hide })}
    </span>
  );
}
