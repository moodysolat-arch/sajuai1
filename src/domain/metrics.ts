import { toKrw, toNumber, toWon } from "@/lib/money";
import type { FinanceSummary } from "./types";
import type { AssetType } from "./enums";

export type AssetLike = {
  type: string;
  currentValue: number | string | { toString(): string };
  debtValue: number | string | { toString(): string };
  monthlyIncome: number | string | { toString(): string };
  monthlyExpense: number | string | { toString(): string };
  fxRateToKrw?: number | string | { toString(): string } | null;
  cash?: { isEmergencyFund: boolean } | null;
};

export function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

/** 총자산 (KRW) */
export function calcTotalAssets(assets: AssetLike[]): number {
  return assets.reduce(
    (sum, a) => sum + toKrw(a.currentValue, a.fxRateToKrw ?? 1),
    0,
  );
}

/** 총부채 (KRW) */
export function calcTotalDebt(assets: AssetLike[]): number {
  return assets.reduce((sum, a) => sum + toKrw(a.debtValue, a.fxRateToKrw ?? 1), 0);
}

/** 순자산 */
export function calcNetWorth(totalAssets: number, totalDebt: number): number {
  return totalAssets - totalDebt;
}

/** 자산 유형별 평가액 (KRW) */
export function calcValueByType(assets: AssetLike[]): Record<AssetType, number> {
  const raw: Record<AssetType, number> = {
    REAL_ESTATE: 0,
    STOCK: 0,
    CASH: 0,
    BUSINESS: 0,
    OTHER: 0,
  };
  for (const a of assets) {
    const key = (a.type in raw ? a.type : "OTHER") as AssetType;
    raw[key] += toKrw(a.currentValue, a.fxRateToKrw ?? 1);
  }
  return raw;
}

/** 자산 구성비 (%) */
export function calcAllocation(
  valueByType: Record<string, number>,
  totalAssets: number,
): Record<string, number> {
  const allocation: Record<string, number> = {};
  for (const [key, value] of Object.entries(valueByType)) {
    allocation[key] = totalAssets > 0 ? (value / totalAssets) * 100 : 0;
  }
  return allocation;
}

/** 월 순현금흐름 (자산 월수입 − 자산 월지출) */
export function calcMonthlyCashflow(assets: AssetLike[]): number {
  let income = 0;
  let expense = 0;
  for (const a of assets) {
    income += toNumber(a.monthlyIncome);
    expense += toNumber(a.monthlyExpense);
  }
  return income - expense;
}

/** 가장 큰 자산군 집중도 (%) */
export function calcConcentration(allocation: Record<string, number>): number {
  const values = Object.values(allocation);
  return values.length ? Math.max(...values) : 0;
}

/** 비상자금(KRW) */
export function calcEmergencyCash(assets: AssetLike[]): number {
  return assets.reduce((sum, a) => {
    if (a.type === "CASH" && a.cash?.isEmergencyFund) {
      return sum + toKrw(a.currentValue, a.fxRateToKrw ?? 1);
    }
    return sum;
  }, 0);
}

/**
 * 비상자금 개월 수 = 비상자금 / 월 생활비.
 * 생활비 0이면 null(계산 불가). 비상금도 없으면 0.
 */
export function calcEmergencyMonths(
  emergencyCash: number,
  monthlyLivingCost: number,
): number | null {
  if (monthlyLivingCost <= 0) {
    return emergencyCash > 0 ? null : 0;
  }
  return emergencyCash / monthlyLivingCost;
}

export type HealthBreakdown = FinanceSummary["healthBreakdown"];

/** 재무 건강: 유동성30 · 부채30 · 집중도20 · 현금흐름20 */
export function calcHealthScores(input: {
  emergencyMonths: number | null;
  emergencyCash: number;
  totalAssets: number;
  totalDebt: number;
  concentration: number;
  monthlyCashflow: number;
  monthlyLivingCost: number;
}): { healthScore: number; healthBreakdown: HealthBreakdown } {
  const living = Math.max(input.monthlyLivingCost, 1);

  const liquidityScore =
    input.emergencyMonths === null
      ? input.emergencyCash > 0
        ? 70
        : 40
      : clamp((input.emergencyMonths / 6) * 100);

  const debtRatio = input.totalAssets > 0 ? (input.totalDebt / input.totalAssets) * 100 : 0;
  const debtScore = clamp(100 - debtRatio * 1.5);
  const concentrationScore = clamp(100 - Math.max(0, input.concentration - 40) * 2);
  const cashflowScore =
    input.monthlyCashflow >= 0
      ? clamp(60 + (input.monthlyCashflow / living) * 20)
      : clamp(40 + (input.monthlyCashflow / living) * 30);

  const healthScore = Math.round(
    liquidityScore * 0.3 +
      debtScore * 0.3 +
      concentrationScore * 0.2 +
      cashflowScore * 0.2,
  );

  return {
    healthScore,
    healthBreakdown: {
      liquidity: Math.round(liquidityScore),
      debt: Math.round(debtScore),
      concentration: Math.round(concentrationScore),
      cashflow: Math.round(cashflowScore),
    },
  };
}

export function computeFinanceSummary(
  assets: AssetLike[],
  profileMonthlyExpense = 0,
): FinanceSummary {
  const totalAssets = calcTotalAssets(assets);
  const totalDebt = calcTotalDebt(assets);
  const netWorth = calcNetWorth(totalAssets, totalDebt);
  const valueByType = calcValueByType(assets);
  const allocation = calcAllocation(valueByType, totalAssets);
  const concentration = calcConcentration(allocation);
  const monthlyCashflow = calcMonthlyCashflow(assets);
  const emergencyCash = calcEmergencyCash(assets);
  const livingCost = toWon(profileMonthlyExpense);
  const emergencyMonths = calcEmergencyMonths(emergencyCash, livingCost);
  const { healthScore, healthBreakdown } = calcHealthScores({
    emergencyMonths,
    emergencyCash,
    totalAssets,
    totalDebt,
    concentration,
    monthlyCashflow,
    monthlyLivingCost: livingCost,
  });

  return {
    totalAssets,
    totalDebt,
    netWorth,
    allocation,
    concentration,
    monthlyCashflow,
    emergencyMonths,
    healthScore,
    healthBreakdown,
  };
}

/** 주식 평가손익·수익률 (통화 단위) */
export function calcStockPnl(input: {
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}) {
  const cost = input.quantity * input.averagePrice;
  const market = input.quantity * input.currentPrice;
  const pnl = market - cost;
  const returnRate = cost > 0 ? (pnl / cost) * 100 : 0;
  return { cost, market, pnl, returnRate };
}

/** 부동산 순자산·담보비율 */
export function calcRealEstateMetrics(input: {
  marketValue: number;
  loanBalance: number;
}) {
  const equity = input.marketValue - input.loanBalance;
  const ltv =
    input.marketValue > 0 ? (input.loanBalance / input.marketValue) * 100 : 0;
  return { equity, ltv };
}
