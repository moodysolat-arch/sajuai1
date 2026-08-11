import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { redirect } from "next/navigation";
import { getOnboardingStatus } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const status = await getOnboardingStatus();
  if (!status.needsOnboarding) {
    redirect("/dashboard");
  }

  return (
    <div className="py-2">
      <OnboardingWizard />
    </div>
  );
}
