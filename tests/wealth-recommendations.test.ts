import { describe, expect, it } from "vitest";
import {
  classifyWealthType,
  pickWealthTypeByGap,
} from "../src/domain/wealth-type";
import { buildRecommendations } from "../src/domain/recommendations";
import type { FinanceSummary, FortuneResult } from "../src/domain/types";

const baseSummary = (over: Partial<FinanceSummary> = {}): FinanceSummary => ({
  totalAssets: 100_000_000,
  totalDebt: 10_000_000,
  netWorth: 90_000_000,
  allocation: {
    REAL_ESTATE: 20,
    STOCK: 20,
    CASH: 20,
    BUSINESS: 20,
    OTHER: 20,
  },
  concentration: 20,
  monthlyCashflow: 500_000,
  emergencyMonths: 4,
  healthScore: 70,
  healthBreakdown: { liquidity: 70, debt: 70, concentration: 70, cashflow: 70 },
  ...over,
});

const fortune: FortuneResult = {
  provider: "demo",
  year: 2026,
  dayMaster: "갑",
  elements: ["목", "화"],
  elementWeights: { 목: 30, 화: 25, 토: 20, 금: 15, 수: 10 },
  pillars: [],
  decadeCycles: [],
  monthly: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    score: i === new Date().getMonth() ? 78 : 60,
    tone: "준비",
    theme: "계획",
    reasons: ["r"],
  })),
  keywords: ["목 기운", "확장"],
  yearlySummary: "요약",
  yearlyScore: 70,
  yearlyTheme: "확장",
  strengths: [],
  cautions: [],
  disclaimer: "demo",
};

describe("classifyWealthType", () => {
  it("uses survey + allocation + cashflow and not fortune in scores", () => {
    const profile = { riskLevel: "GROWTH" as const, goal: "투자 성장" };
    const summary = baseSummary({
      allocation: { STOCK: 80, CASH: 10, REAL_ESTATE: 5, BUSINESS: 5, OTHER: 0 },
    });
    const withFortune = classifyWealthType(profile, summary, fortune);
    const without = classifyWealthType(profile, summary, null);

    expect(withFortune.scores).toEqual(without.scores);
    expect(withFortune.keywords.length).toBeGreaterThan(0);
    expect(without.keywords.length).toBe(0);
    expect(withFortune.method).toContain("사주");
  });

  it("classifies as BALANCED when top-second gap < 8", () => {
    const tied = pickWealthTypeByGap({
      STOCK: 40,
      CASH: 37,
      REAL_ESTATE: 20,
      BUSINESS: 18,
      BALANCED: 22,
    });
    expect(tied.tied).toBe(true);
    expect(tied.finalType).toBe("BALANCED");

    const clear = pickWealthTypeByGap({
      STOCK: 50,
      CASH: 30,
      REAL_ESTATE: 20,
      BUSINESS: 10,
      BALANCED: 15,
    });
    expect(clear.tied).toBe(false);
    expect(clear.finalType).toBe("STOCK");

    const result = classifyWealthType(
      { riskLevel: "BALANCED", goal: "균형 배분" },
      baseSummary({
        allocation: { STOCK: 25, CASH: 25, REAL_ESTATE: 25, BUSINESS: 25, OTHER: 0 },
      }),
      fortune,
    );
    expect(result.reasons.length).toBe(3);
    expect(result.strengths.length).toBe(2);
    expect(result.cautions.length).toBe(2);
  });
});

describe("buildRecommendations", () => {
  it("prioritizes safety rules over fortune", () => {
    const summary = baseSummary({
      emergencyMonths: 1.5,
      totalDebt: 50_000_000,
      totalAssets: 100_000_000,
      concentration: 75,
    });
    const recs = buildRecommendations(
      summary,
      { goal: "내집 마련", birthTime: null },
      fortune,
      [],
    );
    expect(recs[0]?.key).toMatch(/^safety\./);
    expect(recs.some((r) => r.key === "safety.emergency-fund")).toBe(true);
    expect(recs.some((r) => r.key === "safety.debt-ratio")).toBe(true);
    expect(recs.some((r) => r.key === "safety.concentration")).toBe(true);
  });

  it("dedupes by key against existing tasks", () => {
    const summary = baseSummary({ emergencyMonths: 1 });
    const first = buildRecommendations(
      summary,
      { goal: "저축" },
      null,
      [],
    );
    const emergency = first.find((r) => r.key === "safety.emergency-fund");
    expect(emergency).toBeTruthy();
    const second = buildRecommendations(
      summary,
      { goal: "저축" },
      null,
      [
        {
          dedupeKey: "safety.emergency-fund",
          title: emergency!.title,
          status: "TODO",
        },
      ],
    );
    expect(second.some((r) => r.key === "safety.emergency-fund")).toBe(false);
    expect(second.some((r) => r.key.startsWith("open."))).toBe(true);
  });

  it("handles missing fortune without throwing", () => {
    const recs = buildRecommendations(
      baseSummary(),
      { goal: "균형" },
      null,
      [],
    );
    expect(recs.some((r) => r.key === "fortune.generate")).toBe(true);
    expect(recs.every((r) => r.completionCriteria.length > 0)).toBe(true);
    expect(recs.every((r) => !/매수|매도/.test(r.title + r.reason))).toBe(true);
  });

  it("orders open tasks after goals and before mid fortune tags", () => {
    const recs = buildRecommendations(
      baseSummary({ emergencyMonths: 6, concentration: 30, totalDebt: 0 }),
      { goal: "성장" },
      fortune,
      [{ dedupeKey: "custom.task", title: "기존 점검", status: "TODO" }],
    );
    const goalIdx = recs.findIndex((r) => r.key.startsWith("goal."));
    const openIdx = recs.findIndex((r) => r.key.startsWith("open."));
    const fortuneIdx = recs.findIndex((r) => r.key.startsWith("fortune."));
    expect(goalIdx).toBeGreaterThanOrEqual(0);
    expect(openIdx).toBeGreaterThan(goalIdx);
    if (fortuneIdx >= 0) expect(fortuneIdx).toBeGreaterThan(openIdx);
  });
});
