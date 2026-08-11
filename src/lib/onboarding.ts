import { computeFinanceSummary } from "@/domain/metrics";
import { classifyWealthType } from "@/domain/wealth-type";
import { getOptionalProfile, getSessionUser } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";
import { syncFortuneToFirestore, syncProfileToFirestore } from "@/lib/firestore/user-store";
import { fortuneMetaPillar } from "@/lib/fortune-parse";
import { toWon } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { syncRecommendationsForProfile } from "@/lib/sync-recommendations";
import { getFortuneProvider } from "@/services/fortune";
import type { ProfileInput } from "@/lib/validators";

export type OnboardingStatus = {
  needsOnboarding: boolean;
  hasProfile: boolean;
  isDemo: boolean;
  onboardingCompleted: boolean;
  maskDefault: boolean;
};

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const profile = await getOptionalProfile();
  if (!profile) {
    return {
      needsOnboarding: true,
      hasProfile: false,
      isDemo: false,
      onboardingCompleted: false,
      maskDefault: false,
    };
  }
  return {
    needsOnboarding: !profile.onboardingCompleted,
    hasProfile: true,
    isDemo: profile.isDemo,
    onboardingCompleted: profile.onboardingCompleted,
    maskDefault: profile.maskDefault,
  };
}

export async function completeOnboarding(
  input: ProfileInput & { birthTimeUnknown?: boolean },
) {
  const birthTime = input.birthTimeUnknown ? null : input.birthTime ?? null;
  const data = {
    name: input.name,
    calendarType: input.calendarType,
    birthDate: input.birthDate,
    birthTime,
    timezone: input.timezone,
    riskLevel: input.riskLevel,
    goal: input.goal,
    monthlyExpense: input.monthlyExpense,
    preferredActivity: input.preferredActivity ?? "LEARNING",
    investmentHorizon: input.investmentHorizon ?? "Y3_TO_7",
    maskDefault: input.maskDefault ?? false,
    onboardingCompleted: true,
    isDemo: false,
  };

  const existing = await getOptionalProfile();
  const profile = existing
    ? await prisma.userProfile.update({ where: { id: existing.id }, data })
    : await prisma.userProfile.create({ data });

  const session = await getSessionUser();
  if (session) {
    await syncProfileToFirestore({
      uid: session.uid,
      email: session.email ?? profile.email,
      profile,
    });
  }

  const year = new Date().getFullYear();
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

  await prisma.fortuneSnapshot.upsert({
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
      pillarsJson: JSON.stringify([fortuneMetaPillar(fortune), ...fortune.pillars]),
      decadeCyclesJson: JSON.stringify(fortune.decadeCycles),
      monthlyScoresJson: JSON.stringify(fortune.monthly),
      disclaimer: fortune.disclaimer,
    },
    update: {
      pillarsJson: JSON.stringify([fortuneMetaPillar(fortune), ...fortune.pillars]),
      decadeCyclesJson: JSON.stringify(fortune.decadeCycles),
      monthlyScoresJson: JSON.stringify(fortune.monthly),
      disclaimer: fortune.disclaimer,
      generatedAt: new Date(),
    },
  });

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
  const wealthType = classifyWealthType(profile, summary, fortune);
  await syncRecommendationsForProfile({
    profileId: profile.id,
    goal: profile.goal,
    riskLevel: profile.riskLevel,
    birthTime: profile.birthTime,
    summary,
    fortune,
  });

  return { profile, fortune, wealthType, summary };
}
