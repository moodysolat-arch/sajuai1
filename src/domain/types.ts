export type WealthType =
  | "STOCK"
  | "REAL_ESTATE"
  | "CASH"
  | "BUSINESS"
  | "BALANCED";

export type WealthTypeResult = {
  type: WealthType;
  label: string;
  score: number;
  secondType: WealthType;
  secondLabel: string;
  secondScore: number;
  /** 유형별 점수 (설문·자산구성·현금흐름만, 사주 미포함) */
  scores: Record<WealthType, number>;
  reasons: string[];
  strengths: string[];
  cautions: string[];
  /** 계산 방식 설명 */
  method: string;
  /** 사주에서 가져온 설명용 키워드 (점수 미사용) */
  keywords: string[];
};

/** Phase 2(자산관리)용. */
export type FinanceSummary = {
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
  allocation: Record<string, number>;
  concentration: number;
  monthlyCashflow: number;
  emergencyMonths: number | null;
  healthScore: number;
  healthBreakdown: {
    liquidity: number;
    debt: number;
    concentration: number;
    cashflow: number;
  };
};

export type Recommendation = {
  key: string;
  title: string;
  category: string;
  reason: string;
  dueDate?: string;
  completionCriteria: string;
  source: "FINANCE" | "FORTUNE" | "MIXED";
  priority: number;
  status?: "TODO" | "DONE" | "SNOOZED";
};

/** 운세 타입은 공급자 계층이 단일 소스 */
export type {
  FortunePillar,
  DecadeCycle,
  MonthlyFortune,
  FortuneResult,
  FiveElement,
} from "@/services/fortune/types";
