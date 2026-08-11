import { DEMO_BADGE } from "@/services/fortune/mapper";
import { cn } from "@/lib/utils";

export function DemoFortuneBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md bg-accent/15 px-2 py-1 text-[11px] font-medium text-accent",
        className,
      )}
    >
      {DEMO_BADGE}
    </span>
  );
}
