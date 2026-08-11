import { buildRecommendations } from "@/domain/recommendations";
import type { FinanceSummary, FortuneResult } from "@/domain/types";
import { prisma } from "@/lib/prisma";

const STALE_MS = 1000 * 60 * 60 * 24 * 90; // 90일

export async function syncRecommendationsForProfile(input: {
  profileId: string;
  goal: string;
  riskLevel?: string;
  birthTime?: string | null;
  summary: FinanceSummary;
  fortune?: FortuneResult | null;
}) {
  const existing = await prisma.actionTask.findMany({
    where: { profileId: input.profileId },
  });

  const assets = await prisma.asset.findMany({
    where: { profileId: input.profileId },
    select: { updatedAt: true },
  });
  const staleAssetCount = assets.filter(
    (a) => Date.now() - a.updatedAt.getTime() > STALE_MS,
  ).length;

  const recommendations = buildRecommendations(
    input.summary,
    {
      goal: input.goal,
      riskLevel: input.riskLevel,
      birthTime: input.birthTime,
      staleAssetCount,
    },
    input.fortune,
    existing.map((t) => ({
      dedupeKey: t.dedupeKey,
      title: t.title,
      status: t.status,
      dueDate: t.dueDate,
      category: t.category,
      reason: t.reason,
      source: t.source,
      completionCriteria: t.completionCriteria,
    })),
  );

  // 추천 결과 upsert (DONE 유지, TODO/SNOOZED 갱신)
  const keys = recommendations.map((r) => r.key);
  for (const rec of recommendations) {
    if (rec.key.startsWith("open.")) continue; // 기존 미완료 재노출은 DB에 새 행으로 만들지 않음
    const prev = existing.find((t) => t.dedupeKey === rec.key);
    if (prev?.status === "DONE") continue;

    await prisma.actionTask.upsert({
      where: {
        profileId_dedupeKey: {
          profileId: input.profileId,
          dedupeKey: rec.key,
        },
      },
      create: {
        profileId: input.profileId,
        title: rec.title,
        category: rec.category,
        reason: rec.reason,
        completionCriteria: rec.completionCriteria,
        dueDate: rec.dueDate,
        source: rec.source,
        dedupeKey: rec.key,
        status: "TODO",
      },
      update: {
        title: rec.title,
        category: rec.category,
        reason: rec.reason,
        completionCriteria: rec.completionCriteria,
        dueDate: rec.dueDate,
        source: rec.source,
        status: prev?.status === "SNOOZED" ? "SNOOZED" : "TODO",
      },
    });
  }

  // 엔진이 더 이상 내지 않는 TODO 안전/목표/운세 키는 정리하지 않고 유지
  // (사용자가 남긴 DONE·메모 보존). keys는 동기화 로그용.
  return { recommendations, keys };
}
