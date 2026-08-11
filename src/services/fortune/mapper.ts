import type { FortuneResult, FiveElement } from "./types";
import { FIVE_ELEMENTS } from "./types";

export const DEMO_BADGE = "참고용 데모 해석";

const ELEMENT_COLORS: Record<FiveElement, string> = {
  목: "#2E7D5B",
  화: "#C2414B",
  토: "#C8923D",
  금: "#8B93A7",
  수: "#4C6EF5",
};

export type FortuneElementBar = {
  element: FiveElement;
  weight: number;
  color: string;
};

export type FortuneCalendarViewModel = {
  badge: typeof DEMO_BADGE;
  provider: string;
  year: number;
  dayMaster: string;
  hourUnknown: boolean;
  pillars: FortuneResult["pillars"];
  elementBars: FortuneElementBar[];
  elementTotal: number;
  decadeCycles: FortuneResult["decadeCycles"];
  yearlyTheme: FortuneResult["yearlyTheme"];
  yearlyScore: number;
  yearlySummary: string;
  keywords: string[];
  strengths: string[];
  cautions: string[];
  monthly: FortuneResult["monthly"];
  disclaimer: string;
};

/** FortuneResult → 캘린더 UI 모델 (자산 점수와 결합하지 않음) */
export function toFortuneCalendarView(fortune: FortuneResult): FortuneCalendarViewModel {
  const hourPillar = fortune.pillars.find((p) => p.label === "시주");
  const hourUnknown =
    !hourPillar || hourPillar.heavenly === "미상" || hourPillar.earthly === "미상";

  const elementBars: FortuneElementBar[] = FIVE_ELEMENTS.map((element) => ({
    element,
    weight: fortune.elementWeights?.[element] ?? 0,
    color: ELEMENT_COLORS[element],
  }));

  const elementTotal = elementBars.reduce((s, b) => s + b.weight, 0);

  return {
    badge: DEMO_BADGE,
    provider: fortune.provider,
    year: fortune.year,
    dayMaster: fortune.dayMaster,
    hourUnknown,
    pillars: fortune.pillars,
    elementBars,
    elementTotal,
    decadeCycles: fortune.decadeCycles,
    yearlyTheme: fortune.yearlyTheme,
    yearlyScore: fortune.yearlyScore,
    yearlySummary: fortune.yearlySummary,
    keywords: fortune.keywords,
    strengths: fortune.strengths,
    cautions: fortune.cautions,
    monthly: fortune.monthly,
    disclaimer: fortune.disclaimer,
  };
}
