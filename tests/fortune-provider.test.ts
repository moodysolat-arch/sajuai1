import { describe, expect, it } from "vitest";
import {
  DemoFortuneProvider,
  buildDecadeCycles,
  buildElementWeights,
  hashSeed,
} from "../src/services/fortune/demo-provider";
import { FIVE_ELEMENTS } from "../src/services/fortune/types";
import { toFortuneCalendarView, DEMO_BADGE } from "../src/services/fortune/mapper";

const profile = {
  name: "김하늘",
  calendarType: "SOLAR" as const,
  birthDate: "1990-05-12",
  birthTime: null as string | null,
  timezone: "Asia/Seoul",
  riskLevel: "BALANCED",
  goal: "균형 잡힌 재물 습관",
};

describe("DemoFortuneProvider", () => {
  const provider = new DemoFortuneProvider();

  it("same birthDate+year hash yields identical results", async () => {
    const a = await provider.generate(profile, 2026);
    const b = await provider.generate(profile, 2026);
    expect(a).toEqual(b);
    expect(hashSeed("1990-05-12|unknown|2026")).toBe(
      hashSeed("1990-05-12|unknown|2026"),
    );
  });

  it("different year changes result", async () => {
    const a = await provider.generate(profile, 2026);
    const b = await provider.generate(profile, 2027);
    expect(a.monthly.map((m) => m.score)).not.toEqual(b.monthly.map((m) => m.score));
  });

  it("provider is demo", async () => {
    const result = await provider.generate(profile, 2026);
    expect(result.provider).toBe("demo");
    expect(provider.name).toBe("demo");
  });

  it("monthly scores are in 45~85", async () => {
    const result = await provider.generate(profile, 2026);
    expect(result.monthly).toHaveLength(12);
    for (const m of result.monthly) {
      expect(m.score).toBeGreaterThanOrEqual(45);
      expect(m.score).toBeLessThanOrEqual(85);
    }
    expect(result.yearlyScore).toBeGreaterThanOrEqual(45);
    expect(result.yearlyScore).toBeLessThanOrEqual(85);
  });

  it("element weights sum to 100", async () => {
    const result = await provider.generate(profile, 2026);
    const sum = FIVE_ELEMENTS.reduce((s, el) => s + result.elementWeights[el], 0);
    expect(sum).toBe(100);
    for (const el of FIVE_ELEMENTS) {
      expect(result.elementWeights[el]).toBeGreaterThan(0);
    }
  });

  it("buildElementWeights always sums to 100", () => {
    let seed = 1;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 20; i += 1) {
      const w = buildElementWeights(rand);
      expect(Object.values(w).reduce((a, b) => a + b, 0)).toBe(100);
    }
  });

  it("decade cycles are 10-year and non-overlapping", async () => {
    const result = await provider.generate(profile, 2026);
    expect(result.decadeCycles.length).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < result.decadeCycles.length; i += 1) {
      const c = result.decadeCycles[i]!;
      expect(c.endAge - c.startAge).toBe(9);
      if (i > 0) {
        const prev = result.decadeCycles[i - 1]!;
        expect(c.startAge).toBe(prev.endAge + 1);
      }
    }
    const built = buildDecadeCycles(() => 0.3);
    expect(built[1]!.startAge).toBe(built[0]!.endAge + 1);
  });

  it("missing birthTime marks hour pillar as 미상", async () => {
    const result = await provider.generate(profile, 2026);
    const hour = result.pillars.find((p) => p.label === "시주");
    expect(hour?.heavenly).toBe("미상");
    expect(hour?.earthly).toBe("미상");
    expect(toFortuneCalendarView(result).hourUnknown).toBe(true);
  });

  it("birthTime fills hour pillar", async () => {
    const result = await provider.generate(
      { ...profile, birthTime: "09:30" },
      2026,
    );
    const hour = result.pillars.find((p) => p.label === "시주");
    expect(hour?.heavenly).not.toBe("미상");
    expect(hour?.earthly).not.toBe("미상");
  });

  it("avoids banned investment wording", async () => {
    const result = await provider.generate(profile, 2026);
    const blob = [
      result.yearlySummary,
      ...result.keywords,
      ...result.strengths,
      ...result.cautions,
      result.disclaimer,
      ...result.monthly.flatMap((m) => m.reasons),
    ].join(" ");
    expect(blob).not.toMatch(/대박|파산|확정\s*수익|반드시\s*매수/);
  });

  it("mapper always exposes demo badge and no asset score merge", async () => {
    const result = await provider.generate(profile, 2026);
    const view = toFortuneCalendarView(result);
    expect(view.badge).toBe(DEMO_BADGE);
    expect(view.elementTotal).toBe(100);
    expect(view).not.toHaveProperty("healthScore");
    expect(view).not.toHaveProperty("investmentScore");
  });
});
