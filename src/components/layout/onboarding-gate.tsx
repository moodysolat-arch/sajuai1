"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMask } from "@/components/layout/mask-context";

const PUBLIC_PREFIXES = ["/onboarding", "/login", "/api"];

export function OnboardingGate({
  needsOnboarding,
  maskDefault,
  children,
}: {
  needsOnboarding: boolean;
  maskDefault: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setMasked } = useMask();

  useEffect(() => {
    if (maskDefault) setMasked(true);
  }, [maskDefault, setMasked]);

  useEffect(() => {
    const publicPath = PUBLIC_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (needsOnboarding && !publicPath) {
      router.replace("/onboarding");
    }
  }, [needsOnboarding, pathname, router]);

  return <>{children}</>;
}
