"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMask } from "@/components/layout/mask-context";

export function MaskToggle() {
  const { masked, toggle } = useMask();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggle}
      aria-pressed={masked}
      aria-label={masked ? "금액 표시" : "금액 가리기"}
    >
      {masked ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
      <span className="hidden sm:inline">{masked ? "금액 표시" : "금액 가리기"}</span>
    </Button>
  );
}
