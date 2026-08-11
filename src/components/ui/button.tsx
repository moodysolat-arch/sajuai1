import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-[#294E4A] focus-visible:ring-primary/40",
        primary: "bg-primary text-white hover:bg-[#294E4A] focus-visible:ring-primary/40",
        secondary:
          "border border-[#D8DDE7] bg-white text-ink hover:bg-[#F3F5F8] focus-visible:ring-ink/20",
        accent: "bg-accent text-white hover:bg-[#B47F2F] focus-visible:ring-accent/40",
        ghost: "bg-transparent text-ink hover:bg-[#EEF1F5] focus-visible:ring-ink/20",
        outline:
          "border border-[#D8DDE7] bg-transparent text-ink hover:bg-[#F3F5F8] focus-visible:ring-ink/20",
      },
      size: {
        default: "px-3.5 py-2",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-4 py-2.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
