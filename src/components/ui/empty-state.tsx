import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[12px] border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
      role="status"
    >
      <Inbox className="h-8 w-8 text-ink/35" aria-hidden />
      <p className="mt-3 font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-6 text-ink/60">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
