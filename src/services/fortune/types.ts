/**
 * 운세 공급자 계층 타입.
 * 실제 만세력 API로 교체할 때도 이 인터페이스·결과 형태를 유지한다.
 */

export const FIVE_ELEMENTS = ["목", "화", "토", "금", "수"] as const;
export type FiveElement = (typeof FIVE_ELEMENTS)[number];

export type FortunePillar = {
  label: string;
  heavenly: string;
  earthly: string;
};

export type DecadeCycle = {
  startAge: number;
  endAge: number;
  theme: string;
  keywords: string[];
};

export type MonthlyFortune = {
  month: number;
  score: number;
  tone: "탐색" | "준비" | "점검" | "회수";
  theme: string;
  reasons: string[];
};

/** 공급자 공통 결과. UI·DB 스냅샷의 단일 소스. */
export type FortuneResult = {
  provider: "demo" | string;
  year: number;
  dayMaster: string;
  /** 비중 높은 오행 라벨 (표시·키워드용) */
  elements: string[];
  /** 오행 비중 (%). 합계는 반드시 100 */
  elementWeights: Record<FiveElement, number>;
  pillars: FortunePillar[];
  decadeCycles: DecadeCycle[];
  monthly: MonthlyFortune[];
  keywords: string[];
  yearlySummary: string;
  yearlyScore: number;
  yearlyTheme: "안정" | "확장" | "정리";
  strengths: string[];
  cautions: string[];
  disclaimer: string;
};

export type FortuneProfileInput = {
  name: string;
  calendarType: "SOLAR" | "LUNAR";
  birthDate: string;
  birthTime?: string | null;
  timezone: string;
  riskLevel: string;
  goal: string;
};

/**
 * 만세력/운세 공급자 계약.
 * 실제 API 연동 시 이 인터페이스만 구현해 `setFortuneProvider`로 교체한다.
 * 교체 파일: `src/services/fortune/index.ts`, 구현체: `src/services/fortune/*-provider.ts`
 */
export interface FortuneProvider {
  readonly name: string;
  generate(profile: FortuneProfileInput, year: number): Promise<FortuneResult>;
}
