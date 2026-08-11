import { AppShell } from "@/components/layout/app-shell";
import { isAdminEmail } from "@/lib/admin";
import { getSessionUser, isAuthBypassed } from "@/lib/auth";
import { getOnboardingStatus } from "@/lib/onboarding";

export async function AppFrame({ children }: { children: React.ReactNode }) {
  const status = await getOnboardingStatus();
  const user = isAuthBypassed() ? null : await getSessionUser();
  return (
    <AppShell
      needsOnboarding={status.needsOnboarding}
      maskDefault={status.maskDefault}
      isDemo={status.isDemo}
      userEmail={user?.email ?? null}
      isAdmin={isAdminEmail(user?.email)}
    >
      {children}
    </AppShell>
  );
}
