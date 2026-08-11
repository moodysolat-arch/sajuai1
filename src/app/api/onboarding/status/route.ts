import { ok, handleRouteError } from "@/lib/api";
import { getOnboardingStatus } from "@/lib/onboarding";

export async function GET() {
  try {
    const status = await getOnboardingStatus();
    return ok({ status });
  } catch (error) {
    return handleRouteError(error);
  }
}
