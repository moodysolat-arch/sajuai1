import {
  calcHoldingsByPlace,
  calcKpiMonthOverMonth,
  type HoldingPlace,
  type MomDelta,
} from "@/domain/dashboard";
import { calcValueByType, computeFinanceSummary } from "@/domain/metrics";
import type { FinanceSummary, WealthTypeResult } from "@/domain/types";
import { classifyWealthType } from "@/domain/wealth-type";
import { parseFortuneSnapshot } from "@/lib/fortune-parse";
import { toWon } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { syncRecommendationsForProfile } from "@/lib/sync-recommendations";

export type DashboardActionPreview = {
  id: string;
  title: string;
  category: string;
  reason: string;
  dueDate: string | null;
  source: string;
};

export type DashboardPayload = {
  profile: {
    id: string;
    name: string;
    goal: string;
    monthlyExpense: number;
  };
  summary: FinanceSummary;
  valueByType: Record<string, number>;
  holdings: HoldingPlace[];
  mom: {
    totalAssets: MomDelta | null;
    totalDebt: MomDelta | null;
    netWorth: MomDelta | null;
    monthCount: number;
    previousMonth: string | null;
  };
  assetCount: number;
  wealthType: WealthTypeResult;
  priorityActions: DashboardActionPreview[];
  prep: {
    fortuneYearScore: number | null;
    fortuneMonthTheme: string | null;
  };
};

export async function loadDashboardPayload(
  year = new Date().getFullYear(),
): Promise<DashboardPayload> {
  const profile = await getCurrentProfile();
  const assets = await prisma.asset.findMany({
    where: { profileId: profile.id },
    include: {
      realEstate: true,
      stock: true,
      cash: true,
      business: true,
      snapshots: { orderBy: { capturedAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const summary = computeFinanceSummary(assets, toWon(profile.monthlyExpense));
  const valueByType = calcValueByType(assets);

  const snapshots = assets.flatMap((asset) =>
    asset.snapshots.map((s) => ({
      assetId: asset.id,
      value: s.value,
      debt: s.debt,
      capturedAt: s.capturedAt,
      fxRateToKrw: asset.fxRateToKrw,
    })),
  );

  const mom = calcKpiMonthOverMonth(
    {
      totalAssets: summary.totalAssets,
      totalDebt: summary.totalDebt,
      netWorth: summary.netWorth,
    },
    snapshots,
  );

  const holdings = calcHoldingsByPlace(assets, summary.totalAssets);

  const fortuneRow = await prisma.fortuneSnapshot.findFirst({
    where: { profileId: profile.id, year },
    orderBy: { generatedAt: "desc" },
  });
  const fortune = fortuneRow ? parseFortuneSnapshot(fortuneRow) : null;
  const wealthType = classifyWealthType(profile, summary, fortune);
  const month = new Date().getMonth() + 1;
  const thisMonth = fortune?.monthly.find((m) => m.month === month) ?? null;

  try {
    await syncRecommendationsForProfile({
      profileId: profile.id,
      goal: profile.goal,
      riskLevel: profile.riskLevel,
      birthTime: profile.birthTime,
      summary,
      fortune,
    });
  } catch (error) {
    console.error("[dashboard] recommendation sync failed", error);
  }

  const priorityActions = await prisma.actionTask.findMany({
    where: { profileId: profile.id, status: "TODO" },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    take: 3,
  });

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      goal: profile.goal,
      monthlyExpense: toWon(profile.monthlyExpense),
    },
    summary,
    valueByType,
    holdings,
    mom,
    assetCount: assets.length,
    wealthType,
    priorityActions: priorityActions.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      reason: a.reason,
      dueDate: a.dueDate,
      source: a.source,
    })),
    prep: {
      fortuneYearScore: fortune?.yearlyScore ?? null,
      fortuneMonthTheme: thisMonth?.theme ?? null,
    },
  };
}
