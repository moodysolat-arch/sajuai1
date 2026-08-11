import type { FortuneResult } from "@/services/fortune/types";
import { FIVE_ELEMENTS } from "@/services/fortune/types";

type FortuneRow = {
  provider: string;
  year: number;
  pillarsJson: string;
  decadeCyclesJson: string;
  monthlyScoresJson: string;
  disclaimer: string;
};

function emptyWeights(): FortuneResult["elementWeights"] {
  return { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
}

export function parseFortuneSnapshot(row: FortuneRow): FortuneResult {
  const fortune: FortuneResult = {
    provider: row.provider,
    year: row.year,
    dayMaster: "",
    elements: [],
    elementWeights: emptyWeights(),
    pillars: JSON.parse(row.pillarsJson),
    decadeCycles: JSON.parse(row.decadeCyclesJson),
    monthly: JSON.parse(row.monthlyScoresJson),
    keywords: [],
    yearlySummary: "",
    yearlyScore: 0,
    yearlyTheme: "안정",
    strengths: [],
    cautions: [],
    disclaimer: row.disclaimer,
  };

  const meta = fortune.pillars.find((p) => p.label === "__meta");
  if (meta) {
    try {
      const parsed = JSON.parse(meta.heavenly) as Partial<FortuneResult>;
      fortune.dayMaster = parsed.dayMaster ?? "";
      fortune.elements = parsed.elements ?? [];
      fortune.elementWeights = {
        ...emptyWeights(),
        ...(parsed.elementWeights ?? {}),
      };
      fortune.keywords = parsed.keywords ?? [];
      fortune.yearlySummary = parsed.yearlySummary ?? "";
      fortune.yearlyScore = parsed.yearlyScore ?? 0;
      fortune.yearlyTheme = parsed.yearlyTheme ?? "안정";
      fortune.strengths = parsed.strengths ?? [];
      fortune.cautions = parsed.cautions ?? [];
    } catch {
      /* ignore */
    }
    fortune.pillars = fortune.pillars.filter((p) => p.label !== "__meta");
  }

  // 구 스냅샷 호환: weights 없으면 elements로부터 균등 분배
  const weightSum = FIVE_ELEMENTS.reduce((s, el) => s + (fortune.elementWeights[el] ?? 0), 0);
  if (weightSum === 0) {
    const base = Math.floor(100 / FIVE_ELEMENTS.length);
    let rem = 100 - base * FIVE_ELEMENTS.length;
    for (const el of FIVE_ELEMENTS) {
      fortune.elementWeights[el] = base + (rem > 0 ? 1 : 0);
      rem -= 1;
    }
  }

  if (!fortune.yearlySummary) {
    fortune.yearlySummary = `${fortune.year}년 재물운 참고용 데모 해석입니다. 투자 권유가 아닙니다.`;
  }

  return fortune;
}

export function fortuneMetaPillar(fortune: FortuneResult) {
  return {
    label: "__meta",
    heavenly: JSON.stringify({
      dayMaster: fortune.dayMaster,
      elements: fortune.elements,
      elementWeights: fortune.elementWeights,
      keywords: fortune.keywords,
      yearlySummary: fortune.yearlySummary,
      yearlyScore: fortune.yearlyScore,
      yearlyTheme: fortune.yearlyTheme,
      strengths: fortune.strengths,
      cautions: fortune.cautions,
    }),
    earthly: "",
  };
}
