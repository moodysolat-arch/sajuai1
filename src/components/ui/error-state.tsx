import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "문제가 발생했습니다",
  description = "잠시 후 다시 시도해 주세요.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[12px] border border-border bg-card px-6 py-12 text-center",
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-8 w-8 text-caution" aria-hidden />
      <p className="mt-3 font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-6 text-ink/60">{description}</p>
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}
