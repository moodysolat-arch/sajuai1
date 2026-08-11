import { describe, expect, it } from "vitest";
import { classifyWealthType } from "../src/domain/wealth-type";
import { buildFortuneActions } from "../src/domain/fortune-actions";
import type { FinanceSummary, FortuneResult } from "../src/domain/types";

const sampleFortune: FortuneResult = {
  provider: "demo",
  year: 2026,
  dayMaster: "갑",
  elements: ["목", "화", "토"],
  elementWeights: { 목: 30, 화: 25, 토: 20, 금: 15, 수: 10 },
  pillars: [],
  decadeCycles: [],
  monthly: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    score: 50 + i,
    tone: i % 2 === 0 ? "준비" : "점검",
    theme: "테스트",
    reasons: ["a", "b"],
  })),
  keywords: ["목 기운", "성장", "학습"],
  yearlySummary: "테스트 세운",
  yearlyScore: 70,
  yearlyTheme: "확장",
  strengths: ["학습"],
  cautions: ["매매 금지"],
  disclaimer: "demo",
};

const summary: FinanceSummary = {
  totalAssets: 50_000_000,
  totalDebt: 0,
  netWorth: 50_000_000,
  allocation: { STOCK: 40, CASH: 30, REAL_ESTATE: 10, BUSINESS: 20, OTHER: 0 },
  concentration: 40,
  monthlyCashflow: 200_000,
  emergencyMonths: 5,
  healthScore: 60,
  healthBreakdown: { liquidity: 60, debt: 80, concentration: 50, cashflow: 55 },
};

describe("fortune-only domain", () => {
  it("classifies wealth type with finance weights, fortune keywords only", () => {
    const result = classifyWealthType(
      { riskLevel: "GROWTH", goal: "투자 성장" },
      summary,
      sampleFortune,
    );
    expect(result.label).toMatch(/형$/);
    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.reasons).toHaveLength(3);
  });

  it("builds fortune actions without buy/sell wording", () => {
    const actions = buildFortuneActions(
      { goal: "균형 잡힌 재물 습관", birthTime: null },
      sampleFortune,
    );
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.every((a) => a.key)).toBe(true);
    expect(actions.some((a) => /매수|매도/.test(a.title))).toBe(false);
  });
});
