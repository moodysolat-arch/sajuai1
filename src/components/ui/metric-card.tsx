import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  children,
  hint,
  footer,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 overflow-hidden p-4", className)}>
      <p className="truncate text-sm text-ink/55">{label}</p>
      <div className="mt-2 min-w-0 font-display text-[clamp(1.15rem,2.4vw,1.5rem)] font-semibold tracking-tight tabular-nums text-ink">
        {children}
      </div>
      {footer}
      {hint ? <p className="mt-1 text-xs text-ink/45">{hint}</p> : null}
    </Card>
  );
}
