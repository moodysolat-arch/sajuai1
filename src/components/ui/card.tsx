import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "min-w-0 overflow-hidden rounded-[12px] border border-border bg-card p-5 shadow-[0_1px_2px_rgba(23,32,51,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={cn("text-lg font-semibold tracking-tight text-ink", className)}>{children}</h2>
  );
}

export function CardDesc({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("mt-1 text-sm leading-6 text-ink/65", className)}>{children}</p>;
}
