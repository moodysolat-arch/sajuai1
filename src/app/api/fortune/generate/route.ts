import { revalidatePath } from "next/cache";
import { computeFinanceSummary } from "@/domain/metrics";
import { ok, handleRouteError } from "@/lib/api";
import { getCurrentProfile, getSessionUser } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";
import { syncFortuneToFirestore } from "@/lib/firestore/user-store";
import { fortuneMetaPillar } from "@/lib/fortune-parse";
import { toWon } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { syncRecommendationsForProfile } from "@/lib/sync-recommendations";
import { fortuneGenerateSchema } from "@/lib/validators";
import { getFortuneProvider } from "@/services/fortune";

export async function POST(request: Request) {
  try {
    const body = fortuneGenerateSchema.parse(await request.json().catch(() => ({})));
    const year = body.year ?? new Date().getFullYear();
    const profile = await getCurrentProfile();
    const fortune = await getFortuneProvider().generate(
      {
        name: profile.name,
        calendarType: profile.calendarType,
        birthDate: profile.birthDate,
        birthTime: profile.birthTime,
        timezone: profile.timezone,
        riskLevel: profile.riskLevel,
        goal: profile.goal,
      },
      year,
    );

    const pillarsWithMeta = [fortuneMetaPillar(fortune), ...fortune.pillars];

    const snapshot = await prisma.fortuneSnapshot.upsert({
      where: {
        profileId_year_provider: {
          profileId: profile.id,
          year,
          provider: fortune.provider,
        },
      },
      create: {
        profileId: profile.id,
        year,
        provider: fortune.provider,
        pillarsJson: JSON.stringify(pillarsWithMeta),
        decadeCyclesJson: JSON.stringify(fortune.decadeCycles),
        monthlyScoresJson: JSON.stringify(fortune.monthly),
        disclaimer: fortune.disclaimer,
      },
      update: {
        pillarsJson: JSON.stringify(pillarsWithMeta),
        decadeCyclesJson: JSON.stringify(fortune.decadeCycles),
        monthlyScoresJson: JSON.stringify(fortune.monthly),
        disclaimer: fortune.disclaimer,
        generatedAt: new Date(),
      },
    });

    const session = await getSessionUser();
    if (session) {
      await syncFortuneToFirestore({
        uid: session.uid,
        year,
        fortune: {
          provider: fortune.provider,
          year: fortune.year,
          yearlyTheme: fortune.yearlyTheme,
          yearlyScore: fortune.yearlyScore,
        },
      });
    }

    const assets = await listAssetsForProfile(profile.id);
    const summary = computeFinanceSummary(assets, toWon(profile.monthlyExpense));
    const { recommendations } = await syncRecommendationsForProfile({
      profileId: profile.id,
      goal: profile.goal,
      riskLevel: profile.riskLevel,
      birthTime: profile.birthTime,
      summary,
      fortune,
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/fortune");
    revalidatePath("/wealth-type");
    revalidatePath("/actions");

    return ok({ fortune, snapshotId: snapshot.id, recommendations });
  } catch (error) {
    return handleRouteError(error);
  }
}
