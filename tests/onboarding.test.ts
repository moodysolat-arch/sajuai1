import { describe, expect, it } from "vitest";
import { onboardingCompleteSchema } from "../src/lib/validators";
import { SERVICE_DISCLAIMER } from "../src/lib/disclaimer";
import {
  completeOnboarding,
  getOnboardingStatus,
} from "../src/lib/onboarding";
import { prisma } from "../src/lib/prisma";

describe("onboarding validation", () => {
  it("rejects missing birth time without unknown flag", () => {
    const parsed = onboardingCompleteSchema.safeParse({
      name: "테스트",
      goal: "저축",
      calendarType: "SOLAR",
      birthDate: "1995-01-01",
      birthTime: null,
      birthTimeUnknown: false,
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      preferredActivity: "SAVING",
      investmentHorizon: "UNDER_3Y",
      monthlyExpense: 2_000_000,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts birthTimeUnknown", () => {
    const parsed = onboardingCompleteSchema.safeParse({
      name: "테스트",
      goal: "저축",
      calendarType: "SOLAR",
      birthDate: "1995-01-01",
      birthTime: null,
      birthTimeUnknown: true,
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      preferredActivity: "SAVING",
      investmentHorizon: "UNDER_3Y",
      monthlyExpense: 2_000_000,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid monthly expense", () => {
    const parsed = onboardingCompleteSchema.safeParse({
      name: "테스트",
      goal: "저축",
      calendarType: "SOLAR",
      birthDate: "1995-01-01",
      birthTimeUnknown: true,
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      preferredActivity: "LEARNING",
      investmentHorizon: "Y3_TO_7",
      monthlyExpense: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("exposes required disclaimer copy", () => {
    expect(SERVICE_DISCLAIMER).toContain("참고용 해석");
    expect(SERVICE_DISCLAIMER).toContain("금융·투자·세무·법률 자문");
  });
});

describe("onboarding flows (db)", () => {
  it("new user completeOnboarding calculates wealth type and fortune", async () => {
    const result = await completeOnboarding({
      name: "온보딩신규",
      goal: "비상금과 균형 배분",
      calendarType: "SOLAR",
      birthDate: "1992-08-20",
      birthTime: null,
      timezone: "Asia/Seoul",
      riskLevel: "CONSERVATIVE",
      preferredActivity: "SAVING",
      investmentHorizon: "OVER_7Y",
      monthlyExpense: 2_500_000,
      birthTimeUnknown: true,
    });

    expect(result.profile.onboardingCompleted).toBe(true);
    expect(result.profile.isDemo).toBe(false);
    expect(result.profile.birthTime).toBeNull();
    expect(result.fortune.provider).toBe("demo");
    expect(result.fortune.year).toBe(new Date().getFullYear());
    expect(result.wealthType.label).toMatch(/형$/);
    expect(result.wealthType.reasons.length).toBe(3);

    const hour = result.fortune.pillars.find((p) => p.label === "시주");
    expect(hour?.heavenly).toBe("미상");

    const status = await getOnboardingStatus();
    expect(status.needsOnboarding).toBe(false);
    expect(status.hasProfile).toBe(true);
  });

  it("demo user flow marks onboarding completed and isDemo", async () => {
    const profile = await prisma.userProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });
    expect(profile).toBeTruthy();
    await prisma.userProfile.update({
      where: { id: profile!.id },
      data: {
        onboardingCompleted: true,
        isDemo: true,
        name: "김하늘",
      },
    });
    const status = await getOnboardingStatus();
    expect(status.needsOnboarding).toBe(false);
    expect(status.isDemo).toBe(true);
  });
});
