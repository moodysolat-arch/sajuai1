import { cn } from "@/lib/utils";

export function PercentageBadge({
  value,
  digits = 1,
  className,
}: {
  value: number;
  digits?: number;
  className?: string;
}) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
        positive && "bg-positive/10 text-positive",
        negative && "bg-danger/10 text-danger",
        !positive && !negative && "bg-muted text-ink/70",
        className,
      )}
    >
      {positive ? "+" : ""}
      {value.toFixed(digits)}%
    </span>
  );
}
