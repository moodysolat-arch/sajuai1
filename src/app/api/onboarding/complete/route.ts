import { revalidatePath } from "next/cache";
import { ok, handleRouteError } from "@/lib/api";
import { completeOnboarding } from "@/lib/onboarding";
import { onboardingCompleteSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = onboardingCompleteSchema.parse(await request.json());
    const result = await completeOnboarding(body);
    revalidatePath("/", "layout");
    return ok(
      {
        profileId: result.profile.id,
        wealthType: result.wealthType,
        fortuneYear: result.fortune.year,
        onboardingCompleted: true,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
