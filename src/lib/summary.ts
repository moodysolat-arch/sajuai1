import { computeFinanceSummary } from "@/domain/metrics";
import { classifyWealthType } from "@/domain/wealth-type";
import { parseFortuneSnapshot } from "@/lib/fortune-parse";
import { toWon } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";

/** @deprecated getCurrentProfile 사용 */
export async function getDefaultProfile() {
  return getCurrentProfile();
}

/** 재물운 홈/캘린더용 페이로드. */
export async function buildFortuneHomePayload(year = new Date().getFullYear()) {
  const profile = await getCurrentProfile();
  const assets = await listAssetsForProfile(profile.id);
  const summary = computeFinanceSummary(assets, toWon(profile.monthlyExpense));

  const fortuneRow = await prisma.fortuneSnapshot.findFirst({
    where: { profileId: profile.id, year },
    orderBy: { generatedAt: "desc" },
  });

  const fortune = fortuneRow ? parseFortuneSnapshot(fortuneRow) : null;
  const wealthType = classifyWealthType(profile, summary, fortune);

  const actions = await prisma.actionTask.findMany({
    where: { profileId: profile.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return {
    profile,
    wealthType,
    fortune,
    summary,
    actions,
  };
}
