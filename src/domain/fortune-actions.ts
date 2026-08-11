/**
 * @deprecated `buildRecommendations`를 사용하세요.
 * 운세 전용 래퍼는 재무 summary 없이 호출될 때를 위해 유지합니다.
 */
import { buildRecommendations } from "./recommendations";
import type { FinanceSummary, FortuneResult, Recommendation } from "./types";

type ProfileLike = {
  goal: string;
  birthTime?: string | null;
  riskLevel?: string;
};

const EMPTY_SUMMARY: FinanceSummary = {
  totalAssets: 0,
  totalDebt: 0,
  netWorth: 0,
  allocation: {},
  concentration: 0,
  monthlyCashflow: 0,
  emergencyMonths: null,
  healthScore: 0,
  healthBreakdown: { liquidity: 0, debt: 0, concentration: 0, cashflow: 0 },
};

export function buildFortuneActions(
  profile: ProfileLike,
  fortune?: FortuneResult | null,
): Recommendation[] {
  return buildRecommendations(EMPTY_SUMMARY, profile, fortune, []).filter(
    (r) => r.source === "FORTUNE" || r.key.startsWith("goal."),
  );
}

export { buildRecommendations };
