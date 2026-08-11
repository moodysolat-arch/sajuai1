import {
  FIVE_ELEMENTS,
  type FortuneProfileInput,
  type FortuneProvider,
  type FortuneResult,
  type FiveElement,
  type MonthlyFortune,
} from "./types";

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
const TONES: MonthlyFortune["tone"][] = ["탐색", "준비", "점검", "회수"];
const YEAR_THEMES: FortuneResult["yearlyTheme"][] = ["안정", "확장", "정리"];

const DECADE_THEMES = [
  { theme: "기반 쌓기", keywords: ["학습", "저축", "경험"] },
  { theme: "확장과 조율", keywords: ["계획", "관계", "점검"] },
  { theme: "안정적 재정렬", keywords: ["목표 재설정", "여유", "기록"] },
  { theme: "흐름 재정비", keywords: ["정리", "완충", "루틴"] },
  { theme: "지혜로운 유지", keywords: ["지속", "나눔", "성찰"] },
] as const;

const BANNED =
  /대박|파산|확정\s*수익|반드시\s*매수|무조건|보장|필승|폭등|폭락/;

/** FNV-1a 기반 문자열 해시 — 동일 입력에 동일 seed */
export function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 오행 비중 정수, 합계 정확히 100 */
export function buildElementWeights(rand: () => number): Record<FiveElement, number> {
  const raw = FIVE_ELEMENTS.map(() => 1 + rand() * 9);
  const sum = raw.reduce((a, b) => a + b, 0);
  const weights = raw.map((v) => Math.floor((v / sum) * 100));
  let allocated = weights.reduce((a, b) => a + b, 0);
  let i = 0;
  while (allocated < 100) {
    weights[i % weights.length] += 1;
    allocated += 1;
    i += 1;
  }
  while (allocated > 100) {
    const idx = i % weights.length;
    if (weights[idx] > 1) {
      weights[idx] -= 1;
      allocated -= 1;
    }
    i += 1;
  }
  return {
    목: weights[0],
    화: weights[1],
    토: weights[2],
    금: weights[3],
    수: weights[4],
  };
}

/** 10년 단위·비중첩 대운 구간 */
export function buildDecadeCycles(rand: () => number) {
  const startAge = 15 + Math.floor(rand() * 6); // 15~20
  return DECADE_THEMES.map((t, index) => {
    const start = startAge + index * 10;
    return {
      startAge: start,
      endAge: start + 9,
      theme: t.theme,
      keywords: [...t.keywords],
    };
  });
}

function monthlyScore(rand: () => number) {
  return Math.round(45 + rand() * 40); // 45~85
}

function toneTheme(tone: MonthlyFortune["tone"]) {
  if (tone === "탐색") return "정보 탐색·시야 넓히기";
  if (tone === "준비") return "계획·학습 준비";
  if (tone === "점검") return "기록·리스크 점검";
  return "정리·회수·숨 고르기";
}

function sanitize(text: string) {
  return BANNED.test(text) ? "참고용 데모 해석 문장" : text;
}

/**
 * 데모 운세 공급자.
 * 생년월일(+출생시각)·선택 연도 해시로 결정론적 결과를 만든다.
 * 실제 만세력 계산이 아니며 provider는 항상 `demo`.
 */
export class DemoFortuneProvider implements FortuneProvider {
  readonly name = "demo" as const;

  async generate(profile: FortuneProfileInput, year: number): Promise<FortuneResult> {
    const seedInput = `${profile.birthDate}|${profile.birthTime ?? "unknown"}|${year}`;
    const seed = hashSeed(seedInput);
    const rand = mulberry32(seed);
    const pick = <T>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]!;

    const hourKnown = Boolean(profile.birthTime && profile.birthTime.trim());

    const pillars = [
      { label: "연주", heavenly: pick(STEMS), earthly: pick(BRANCHES) },
      { label: "월주", heavenly: pick(STEMS), earthly: pick(BRANCHES) },
      { label: "일주", heavenly: pick(STEMS), earthly: pick(BRANCHES) },
      {
        label: "시주",
        heavenly: hourKnown ? pick(STEMS) : "미상",
        earthly: hourKnown ? pick(BRANCHES) : "미상",
      },
    ];

    const dayMaster = pillars[2]!.heavenly;
    const elementWeights = buildElementWeights(rand);
    const elements = (Object.entries(elementWeights) as [FiveElement, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([el]) => el);

    const yearlyTheme = pick(YEAR_THEMES);
    const yearlyScore = monthlyScore(rand);
    const decadeCycles = buildDecadeCycles(rand);

    const monthly: MonthlyFortune[] = Array.from({ length: 12 }, (_, i) => {
      const tone = pick(TONES);
      return {
        month: i + 1,
        score: monthlyScore(rand),
        tone,
        theme: toneTheme(tone),
        reasons: [
          `${year}년 ${i + 1}월은 ${tone} 흐름이 상대적으로 뚜렷합니다.`,
          "참고용 데모 해석이며 수익·손실을 예측하지 않습니다.",
        ],
      };
    });

    const keywords = [
      `${elements[0]} 기운`,
      `재성·${yearlyTheme}`,
      profile.riskLevel === "CONSERVATIVE" ? "안정 선호" : "성장 탐색",
      hourKnown ? "시주 반영" : "시주 미상",
      "학습",
    ].map(sanitize);

    const yearlySummary = sanitize(
      `${year}년 재물운은「${yearlyTheme}」 톤이 두드러집니다(참고 지수 ${yearlyScore}). 일간 ${dayMaster}·오행 분포는 데모 해시 결과이며 실제 만세력이 아닙니다.`,
    );

    return {
      provider: this.name,
      year,
      dayMaster,
      elements,
      elementWeights,
      pillars,
      decadeCycles,
      monthly,
      keywords,
      yearlySummary,
      yearlyScore,
      yearlyTheme,
      strengths: [
        "학습 루틴",
        "목표 문장화",
        `${yearlyTheme} 톤에 맞는 페이스`,
      ].map(sanitize),
      cautions: [
        "특정 종목·시점 매매로 해석하지 않기",
        "고점수=투자 확대 금지",
        "운세 점수와 자산 점수를 합산하지 않기",
      ].map(sanitize),
      disclaimer:
        "참고용 데모 해석입니다. 실제 만세력·명리 계산이 아니며, 미래 수익을 보장하거나 금융·투자 자문을 제공하지 않습니다. (provider: demo)",
    };
  }
}
