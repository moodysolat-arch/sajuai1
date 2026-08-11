import { describe, expect, it } from "vitest";
import {
  aggregateSnapshotsByMonth,
  calcHoldingsByPlace,
  calcKpiMonthOverMonth,
  monthKeySeoul,
} from "../src/domain/dashboard";

describe("dashboard domain", () => {
  it("monthKeySeoul formats YYYY-MM", () => {
    expect(monthKeySeoul("2026-03-15T03:00:00.000Z")).toMatch(/^\d{4}-\d{2}$/);
  });

  it("does not show MoM with fewer than 2 month buckets", () => {
    const mom = calcKpiMonthOverMonth(
      { totalAssets: 100, totalDebt: 10, netWorth: 90 },
      [
        {
          assetId: "a",
          value: 100,
          debt: 10,
          capturedAt: "2026-08-01T00:00:00.000Z",
          fxRateToKrw: 1,
        },
      ],
    );
    expect(mom.totalAssets).toBeNull();
    expect(mom.monthCount).toBe(1);
  });

  it("shows MoM against previous month when 2+ months exist", () => {
    const snapshots = [
      {
        assetId: "a",
        value: 80,
        debt: 20,
        capturedAt: "2026-07-15T03:00:00.000Z",
        fxRateToKrw: 1,
      },
      {
        assetId: "a",
        value: 100,
        debt: 20,
        capturedAt: "2026-08-15T03:00:00.000Z",
        fxRateToKrw: 1,
      },
    ];
    const months = aggregateSnapshotsByMonth(snapshots);
    expect(months.length).toBe(2);

    const mom = calcKpiMonthOverMonth(
      { totalAssets: 120, totalDebt: 20, netWorth: 100 },
      snapshots,
    );
    expect(mom.totalAssets).not.toBeNull();
    expect(mom.totalAssets!.previous).toBe(80);
    expect(mom.totalAssets!.delta).toBe(40);
    expect(mom.totalAssets!.deltaPct).toBeCloseTo(50);
  });

  it("avoids divide-by-zero in MoM pct", () => {
    const mom = calcKpiMonthOverMonth(
      { totalAssets: 50, totalDebt: 0, netWorth: 50 },
      [
        {
          assetId: "a",
          value: 0,
          debt: 0,
          capturedAt: "2026-07-01T00:00:00.000Z",
          fxRateToKrw: 1,
        },
        {
          assetId: "a",
          value: 10,
          debt: 0,
          capturedAt: "2026-08-01T00:00:00.000Z",
          fxRateToKrw: 1,
        },
      ],
    );
    expect(mom.totalAssets!.deltaPct).toBeNull();
  });

  it("calcHoldingsByPlace sorts by value and zeros share when total is 0", () => {
    const rows = calcHoldingsByPlace(
      [
        {
          id: "1",
          type: "CASH",
          name: "비상금",
          institutionOrLocation: "카카오뱅크",
          currentValue: 1_000_000,
          cash: { accountType: "입출금" },
        },
        {
          id: "2",
          type: "REAL_ESTATE",
          name: "마포 아파트",
          institutionOrLocation: "서울",
          currentValue: 9_000_000,
          realEstate: { address: "서울 마포구" },
        },
      ],
      10_000_000,
    );
    expect(rows[0].id).toBe("2");
    expect(rows[0].sharePct).toBeCloseTo(90);
    expect(rows[0].detail).toContain("마포");

    const empty = calcHoldingsByPlace(
      [{ id: "1", type: "CASH", name: "x", currentValue: 0 }],
      0,
    );
    expect(empty[0].sharePct).toBe(0);
  });
});
