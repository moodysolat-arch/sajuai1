"use client";

import { useEffect } from "react";
import { useMask } from "@/components/layout/mask-context";

/**
 * 금액 숨김 기본값만 반영.
 * 온보딩 강제 리다이렉트는 로그인 후 종합 재물운 진입을 막아서 제거함.
 */
export function OnboardingGate({
  maskDefault,
  children,
}: {
  needsOnboarding?: boolean;
  maskDefault: boolean;
  children: React.ReactNode;
}) {
  const { setMasked } = useMask();

  useEffect(() => {
    if (maskDefault) setMasked(true);
  }, [maskDefault, setMasked]);

  return <>{children}</>;
}
