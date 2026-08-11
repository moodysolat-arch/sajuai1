import { ok, handleRouteError } from "@/lib/api";
import { computeFinanceSummary } from "@/domain/metrics";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";
import { toWon } from "@/lib/money";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    const assets = await listAssetsForProfile(profile.id);
    const summary = computeFinanceSummary(assets, toWon(profile.monthlyExpense));

    return ok({
      summary,
      profile: {
        id: profile.id,
        name: profile.name,
        goal: profile.goal,
        riskLevel: profile.riskLevel,
        monthlyExpense: profile.monthlyExpense,
        email: profile.email,
      },
      assetCount: assets.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
