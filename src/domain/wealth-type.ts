import type { FinanceSummary, FortuneResult, WealthType, WealthTypeResult } from "./types";

export const WEALTH_TYPE_LABELS: Record<WealthType, string> = {
  STOCK: "주식형",
  REAL_ESTATE: "부동산형",
  CASH: "저축형",
  BUSINESS: "사업형",
  BALANCED: "균형형",
};

const ALL_TYPES: WealthType[] = [
  "STOCK",
  "REAL_ESTATE",
  "CASH",
  "BUSINESS",
  "BALANCED",
];

export type WealthTypeProfile = {
  riskLevel: "CONSERVATIVE" | "BALANCED" | "GROWTH";
  goal: string;
};

const METHOD =
  "온보딩 설문 50% + 현재 자산 구성 30% + 현금흐름 특성 20%. 사주 정보는 유형 점수에 넣지 않고 설명 키워드에만 사용합니다. 최고점과 차점 차이가 8점 미만이면 균형형으로 분류합니다.";

function emptyScores(): Record<WealthType, number> {
  return { STOCK: 0, REAL_ESTATE: 0, CASH: 0, BUSINESS: 0, BALANCED: 0 };
}

/** 설문 50점 만점 */
export function scoreFromSurvey(profile: WealthTypeProfile): Record<WealthType, number> {
  const scores = emptyScores();
  if (profile.riskLevel === "GROWTH") {
    scores.STOCK += 18;
    scores.BUSINESS += 14;
    scores.BALANCED += 4;
  } else if (profile.riskLevel === "CONSERVATIVE") {
    scores.CASH += 18;
    scores.REAL_ESTATE += 14;
    scores.BALANCED += 4;
  } else {
    scores.BALANCED += 16;
    scores.STOCK += 6;
    scores.CASH += 6;
    scores.REAL_ESTATE += 4;
    scores.BUSINESS += 4;
  }

  const goal = profile.goal;
  if (/비상|안전|저축|현금|유동/.test(goal)) scores.CASH += 14;
  if (/투자|성장|주식|시장/.test(goal)) scores.STOCK += 14;
  if (/내집|부동산|주택/.test(goal)) scores.REAL_ESTATE += 14;
  if (/사업|창업|자영업/.test(goal)) scores.BUSINESS += 14;
  if (/균형|배분|분산/.test(goal)) scores.BALANCED += 12;

  // 설문 영역이 과하면 비율로 50에 맞춤
  const sum = ALL_TYPES.reduce((s, t) => s + scores[t], 0);
  if (sum > 50 && sum > 0) {
    for (const t of ALL_TYPES) {
      scores[t] = (scores[t] / sum) * 50;
    }
  }
  return scores;
}

/** 자산 구성 30점 만점 */
export function scoreFromAllocation(
  allocation: Record<string, number> | undefined,
): Record<WealthType, number> {
  const scores = emptyScores();
  if (!allocation) {
    scores.BALANCED += 10;
    return scores;
  }
  scores.REAL_ESTATE += ((allocation.REAL_ESTATE ?? 0) / 100) * 30;
  scores.STOCK += ((allocation.STOCK ?? 0) / 100) * 30;
  scores.CASH += ((allocation.CASH ?? 0) / 100) * 30;
  scores.BUSINESS += ((allocation.BUSINESS ?? 0) / 100) * 30;
  const other = (allocation.OTHER ?? 0) / 100;
  scores.BALANCED += other * 30;
  // 분산되어 있으면 균형에 소폭 가산
  const parts = [
    allocation.REAL_ESTATE ?? 0,
    allocation.STOCK ?? 0,
    allocation.CASH ?? 0,
    allocation.BUSINESS ?? 0,
  ].filter((v) => v >= 10).length;
  if (parts >= 3) scores.BALANCED += 4;
  return scores;
}

/** 현금흐름 특성 20점 만점 */
export function scoreFromCashflow(summary?: FinanceSummary | null): Record<WealthType, number> {
  const scores = emptyScores();
  if (!summary) {
    scores.BALANCED += 8;
    return scores;
  }
  const cf = summary.monthlyCashflow;
  const living = 1; // 비율용 자리 — 절대값 구간으로 판정
  if (cf > 1_000_000) {
    scores.BUSINESS += 8;
    scores.STOCK += 6;
    scores.BALANCED += 4;
  } else if (cf > 0) {
    scores.BALANCED += 8;
    scores.CASH += 6;
    scores.STOCK += 4;
  } else if (cf === 0) {
    scores.CASH += 8;
    scores.BALANCED += 6;
  } else {
    scores.CASH += 10;
    scores.REAL_ESTATE += 4;
    scores.BALANCED += 4;
  }

  const months = summary.emergencyMonths;
  if (months == null) {
    scores.BALANCED += 2;
  } else if (months < 3) {
    scores.CASH += 6;
  } else if (months >= 6) {
    scores.STOCK += 3;
    scores.BUSINESS += 3;
    scores.BALANCED += 2;
  } else {
    scores.BALANCED += 4;
    scores.CASH += 2;
  }

  void living;
  // 상한 20 근처로 클램프(합이 과도하면 스케일)
  const sum = ALL_TYPES.reduce((s, t) => s + scores[t], 0);
  if (sum > 20 && sum > 0) {
    for (const t of ALL_TYPES) scores[t] = (scores[t] / sum) * 20;
  }
  return scores;
}

function fortuneKeywords(fortune?: FortuneResult | null): string[] {
  if (!fortune) return [];
  const fromFortune = [
    ...fortune.keywords,
    fortune.dayMaster && `일간 ${fortune.dayMaster}`,
    fortune.yearlyTheme && `세운 ${fortune.yearlyTheme}`,
    ...(fortune.elements ?? []).slice(0, 3),
  ].filter(Boolean) as string[];
  return [...new Set(fromFortune)].slice(0, 6);
}

/** 최고점·차점 차이가 8점 미만이면 균형형 */
export function pickWealthTypeByGap(
  scores: Record<WealthType, number>,
): { finalType: WealthType; topType: WealthType; topScore: number; secondType: WealthType; secondScore: number; gap: number; tied: boolean } {
  const ranked = ALL_TYPES.map((t) => [t, scores[t]] as const).sort(
    (a, b) => b[1] - a[1],
  );
  const [topType, topScore] = ranked[0]!;
  const [secondType, secondScore] = ranked[1] ?? ranked[0]!;
  const gap = topScore - secondScore;
  const tied = gap < 8;
  return {
    finalType: tied ? "BALANCED" : topType,
    topType,
    topScore,
    secondType,
    secondScore,
    gap,
    tied,
  };
}

/**
 * 재물 유형 분류.
 * 점수: 설문 50 + 자산구성 30 + 현금흐름 20.
 * 사주는 점수에 넣지 않고 keywords·설명에만 사용.
 */
export function classifyWealthType(
  profile: WealthTypeProfile,
  summary?: FinanceSummary | null,
  fortune?: FortuneResult | null,
): WealthTypeResult {
  const survey = scoreFromSurvey(profile);
  const allocation = scoreFromAllocation(summary?.allocation);
  const cashflow = scoreFromCashflow(summary);

  const scores = emptyScores();
  for (const t of ALL_TYPES) {
    scores[t] = survey[t] + allocation[t] + cashflow[t];
  }

  const { finalType, topType, topScore, secondType, secondScore, gap, tied } =
    pickWealthTypeByGap(scores);

  const keywords = fortuneKeywords(fortune);
  const desc = wealthTypeDescription(finalType);

  const reasons = [
    `설문(위험선호·목표) 가중이 유형 점수의 약 50%를 차지합니다.`,
    summary
      ? `현재 자산 구성(약 30%)과 현금흐름·비상자금(약 20%)을 반영했습니다.`
      : `자산 요약이 없어 설문 중심으로 분류했고, 자산 등록 후 구성·현금흐름 가중이 반영됩니다.`,
    tied
      ? `최고점(${WEALTH_TYPE_LABELS[topType]} ${topScore.toFixed(1)})과 차점(${WEALTH_TYPE_LABELS[secondType]} ${secondScore.toFixed(1)}) 차이가 ${gap.toFixed(1)}점으로 8점 미만이라 균형형으로 분류했습니다.`
      : `1순위 ${WEALTH_TYPE_LABELS[topType]}(${topScore.toFixed(1)}점), 2순위 ${WEALTH_TYPE_LABELS[secondType]}(${secondScore.toFixed(1)}점)입니다.`,
  ];

  if (keywords.length) {
    // 사주는 점수에 미반영 — 설명 보강만
    reasons[2] = `${reasons[2]} 사주 키워드(${keywords.slice(0, 3).join("·")})는 설명용입니다.`;
  }

  return {
    type: finalType,
    label: WEALTH_TYPE_LABELS[finalType],
    score: Math.round(scores[finalType] || topScore),
    secondType,
    secondLabel: WEALTH_TYPE_LABELS[secondType],
    secondScore: Math.round(secondScore),
    scores: {
      STOCK: Math.round(scores.STOCK),
      REAL_ESTATE: Math.round(scores.REAL_ESTATE),
      CASH: Math.round(scores.CASH),
      BUSINESS: Math.round(scores.BUSINESS),
      BALANCED: Math.round(scores.BALANCED),
    },
    reasons: reasons.slice(0, 3),
    strengths: desc.strengths.slice(0, 2),
    cautions: desc.cautions.slice(0, 2),
    method: METHOD,
    keywords,
  };
}

export function wealthTypeDescription(type: WealthType): {
  blurb: string;
  strengths: string[];
  cautions: string[];
} {
  const map: Record<
    WealthType,
    { blurb: string; strengths: string[]; cautions: string[] }
  > = {
    STOCK: {
      blurb: "변동성을 받아들이며 시장·학습을 통해 재물을 키우려는 성향에 가깝습니다.",
      strengths: ["정보 학습 속도", "성장 목표와의 정합"],
      cautions: ["과한 확신을 피하고 점검 루틴 유지", "단일 테마 편중을 기록으로 관리"],
    },
    REAL_ESTATE: {
      blurb: "장기 보유와 현물·안정의 언어로 재물을 이해하는 성향에 가깝습니다.",
      strengths: ["장기 관점", "계획적 점검"],
      cautions: ["유동성·기회비용을 함께 기록", "집중 보유 시 대안 시나리오 점검"],
    },
    CASH: {
      blurb: "저축·유동성·버퍼를 우선하는 재물 성향에 가깝습니다.",
      strengths: ["안전 버퍼", "현금흐름 인식"],
      cautions: ["목표 대비 과도한 정체 점검", "물가·기회비용을 분기마다 기록"],
    },
    BUSINESS: {
      blurb: "주도성과 변동 소득·실행력으로 재물을 만드는 성향에 가깝습니다.",
      strengths: ["실행력", "자기주도"],
      cautions: ["수입 변동 대비 기록 습관", "개인 생활비와 사업 현금 분리 점검"],
    },
    BALANCED: {
      blurb: "한쪽으로 치우치지 않고 조율하며 재물 계획을 세우는 성향에 가깝습니다.",
      strengths: ["배분 감각", "목표 재정렬"],
      cautions: ["결정 미루기 방지용 월 점검일", "우선순위 1개를 문장으로 고정"],
    },
  };
  return map[type];
}
