import { describe, expect, it } from "vitest";
import {
  calcAllocation,
  calcConcentration,
  calcEmergencyCash,
  calcEmergencyMonths,
  calcHealthScores,
  calcMonthlyCashflow,
  calcNetWorth,
  calcRealEstateMetrics,
  calcStockPnl,
  calcTotalAssets,
  calcTotalDebt,
  calcValueByType,
  computeFinanceSummary,
} from "../src/domain/metrics";

const sample = [
  {
    type: "REAL_ESTATE",
    currentValue: 100_000_000,
    debtValue: 40_000_000,
    monthlyIncome: 500_000,
    monthlyExpense: 200_000,
  },
  {
    type: "STOCK",
    currentValue: 20_000_000,
    debtValue: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
  },
  {
    type: "CASH",
    currentValue: 6_000_000,
    debtValue: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    cash: { isEmergencyFund: true },
  },
];

describe("finance metrics pure functions", () => {
  it("calcTotalAssets / calcTotalDebt / calcNetWorth", () => {
    const assets = calcTotalAssets(sample);
    const debt = calcTotalDebt(sample);
    expect(assets).toBe(126_000_000);
    expect(debt).toBe(40_000_000);
    expect(calcNetWorth(assets, debt)).toBe(86_000_000);
  });

  it("calcValueByType and calcAllocation", () => {
    const byType = calcValueByType(sample);
    expect(byType.REAL_ESTATE).toBe(100_000_000);
    expect(byType.STOCK).toBe(20_000_000);
    expect(byType.CASH).toBe(6_000_000);
    const allocation = calcAllocation(byType, 126_000_000);
    expect(allocation.REAL_ESTATE).toBeCloseTo(79.365, 2);
  });

  it("calcMonthlyCashflow", () => {
    expect(calcMonthlyCashflow(sample)).toBe(300_000);
  });

  it("calcConcentration", () => {
    expect(calcConcentration({ A: 10, B: 70, C: 20 })).toBe(70);
  });

  it("calcEmergencyMonths", () => {
    expect(calcEmergencyCash(sample)).toBe(6_000_000);
    expect(calcEmergencyMonths(6_000_000, 2_000_000)).toBe(3);
    expect(calcEmergencyMonths(1_000_000, 0)).toBeNull();
    expect(calcEmergencyMonths(0, 0)).toBe(0);
  });

  it("calcHealthScores weights", () => {
    const { healthScore, healthBreakdown } = calcHealthScores({
      emergencyMonths: 6,
      emergencyCash: 12_000_000,
      totalAssets: 100,
      totalDebt: 0,
      concentration: 40,
      monthlyCashflow: 1_000_000,
      monthlyLivingCost: 2_000_000,
    });
    expect(healthBreakdown.liquidity).toBe(100);
    expect(healthBreakdown.debt).toBe(100);
    expect(healthBreakdown.concentration).toBe(100);
    expect(healthScore).toBeGreaterThan(70);
  });

  it("computeFinanceSummary integrates", () => {
    const summary = computeFinanceSummary(sample, 2_000_000);
    expect(summary.totalAssets).toBe(126_000_000);
    expect(summary.netWorth).toBe(86_000_000);
    expect(summary.monthlyCashflow).toBe(300_000);
    expect(summary.emergencyMonths).toBe(3);
    expect(summary.concentration).toBeCloseTo(79.365, 2);
    expect(summary.healthScore).toBeGreaterThan(0);
  });

  it("stock and real-estate helpers", () => {
    const stock = calcStockPnl({
      quantity: 10,
      averagePrice: 100,
      currentPrice: 120,
    });
    expect(stock.pnl).toBe(200);
    expect(stock.returnRate).toBe(20);

    const re = calcRealEstateMetrics({
      marketValue: 100,
      loanBalance: 40,
    });
    expect(re.equity).toBe(60);
    expect(re.ltv).toBe(40);
  });

  it("applies fxRateToKrw", () => {
    const assets = [
      {
        type: "STOCK",
        currentValue: 100,
        debtValue: 0,
        monthlyIncome: 0,
        monthlyExpense: 0,
        fxRateToKrw: 10,
      },
    ];
    expect(calcTotalAssets(assets)).toBe(1000);
  });
});
