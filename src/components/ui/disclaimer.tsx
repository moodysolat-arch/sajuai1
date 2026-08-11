import { SERVICE_DISCLAIMER } from "@/lib/disclaimer";
import { cn } from "@/lib/utils";

export function DisclaimerNotice({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <p
      role="note"
      className={cn(
        "rounded-[12px] border border-border bg-muted/60 text-ink/65",
        compact ? "px-3 py-2 text-xs leading-5" : "px-4 py-3 text-sm leading-6",
        className,
      )}
    >
      {SERVICE_DISCLAIMER}
    </p>
  );
}
