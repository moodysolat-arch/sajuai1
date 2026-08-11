import type { FinanceSummary, FortuneResult, Recommendation } from "./types";

export type RecommendationProfile = {
  goal: string;
  riskLevel?: string;
  birthTime?: string | null;
  /** 평가 갱신이 오래된 자산 수 (호출측 산출) */
  staleAssetCount?: number;
};

export type ExistingTask = {
  key?: string | null;
  dedupeKey?: string | null;
  title: string;
  status: "TODO" | "DONE" | "SNOOZED";
  dueDate?: string | null;
  category?: string;
  reason?: string;
  source?: "FINANCE" | "FORTUNE" | "MIXED";
  completionCriteria?: string | null;
};

function taskKey(task: ExistingTask) {
  return task.dedupeKey || task.key || task.title;
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function endOfMonth(year: number, month: number) {
  const last = new Date(year, month, 0).getDate();
  return isoDate(year, month, last);
}

const BANNED = /매수|매도|종목|ETF|코인|아파트\s*추천|특정\s*지역/;

function safeText(text: string) {
  return BANNED.test(text) ? "학습·기록·점검용 참고 과제입니다." : text;
}

/**
 * 실행 과제 추천 엔진.
 * 우선순위: 1 안전규칙 → 2 재무목표 → 3 미완료 과제 → 4 월운 태그
 * 특정 종목·상품·지역 매매를 추천하지 않는다.
 */
export function buildRecommendations(
  summary: FinanceSummary,
  profile: RecommendationProfile,
  fortune: FortuneResult | null | undefined,
  existingTasks: ExistingTask[],
): Recommendation[] {
  const items: Recommendation[] = [];
  const now = new Date();
  const year = fortune?.year ?? now.getFullYear();
  const month = now.getMonth() + 1;
  const existingKeys = new Set(existingTasks.map(taskKey));

  const debtRatio =
    summary.totalAssets > 0 ? (summary.totalDebt / summary.totalAssets) * 100 : 0;

  // 1) 안전 규칙
  if (summary.emergencyMonths != null && summary.emergencyMonths < 3) {
    items.push({
      key: "safety.emergency-fund",
      title: "비상자금 목표 설정",
      category: "안전",
      reason: `비상자금이 약 ${summary.emergencyMonths.toFixed(1)}개월분입니다. 생활비 3개월 버퍼 목표를 문장으로 적고 계좌를 표시해 두세요.`,
      completionCriteria: "비상자금 목표 금액·계좌·점검일을 메모에 기록함",
      source: "FINANCE",
      priority: 100,
      dueDate: endOfMonth(year, month),
    });
  }

  if (debtRatio > 40) {
    items.push({
      key: "safety.debt-ratio",
      title: "대출잔액과 상환계획 점검",
      category: "안전",
      reason: `부채비율이 약 ${debtRatio.toFixed(1)}%로 40%를 넘습니다. 잔액·금리·상환일을 표로 정리하세요.`,
      completionCriteria: "대출 잔액·월 상환액·다음 점검일을 한 표에 기록함",
      source: "FINANCE",
      priority: 98,
      dueDate: endOfMonth(year, month),
    });
  }

  if (summary.concentration > 70) {
    items.push({
      key: "safety.concentration",
      title: "집중 위험 요인 기록",
      category: "안전",
      reason: `단일 자산군 집중도가 약 ${summary.concentration.toFixed(1)}%입니다. 어떤 유형이 과도한지와 완화 아이디어 1개를 적으세요.`,
      completionCriteria: "집중 자산군·위험 요인·다음 점검 포인트를 기록함",
      source: "FINANCE",
      priority: 96,
      dueDate: endOfMonth(year, month),
    });
  }

  if ((profile.staleAssetCount ?? 0) > 0) {
    items.push({
      key: "safety.stale-valuation",
      title: "평가액 갱신",
      category: "안전",
      reason: `오래 갱신되지 않은 자산이 ${profile.staleAssetCount}건 있습니다. 시세·잔액을 확인하고 평가액을 업데이트하세요.`,
      completionCriteria: "오래된 자산의 평가액·메모를 갱신함",
      source: "FINANCE",
      priority: 94,
      dueDate: endOfMonth(year, month),
    });
  }

  // 2) 사용자 재무 목표
  if (profile.goal?.trim()) {
    items.push({
      key: "goal.rewrite",
      title: "재물 목표 문장 구체화",
      category: "목표",
      reason: safeText(
        `현재 목표「${profile.goal.slice(0, 48)}」를 이번 달 행동 1개와 연결해 다시 쓰세요.`,
      ),
      completionCriteria: "목표 문장과 이번 달 행동 1개를 메모에 저장함",
      source: "FINANCE",
      priority: 85,
      dueDate: endOfMonth(year, month),
    });
  } else {
    items.push({
      key: "goal.define",
      title: "재물 목표 초안 작성",
      category: "목표",
      reason: "아직 목표가 비어 있습니다. 원하는 상태와 기간을 한 문장으로 적어 보세요.",
      completionCriteria: "목표 문장 1줄을 프로필·메모에 저장함",
      source: "FINANCE",
      priority: 86,
      dueDate: endOfMonth(year, month),
    });
  }

  // 3) 미완료 과제 — 기존 TODO를 우선순위에 재노출
  for (const task of existingTasks.filter((t) => t.status === "TODO")) {
    items.push({
      key: `open.${taskKey(task)}`,
      title: `미완료: ${task.title}`,
      category: task.category ?? "미완료",
      reason: task.reason ?? "아직 끝나지 않은 과제입니다. 오늘 할 최소 행동 1개를 정하세요.",
      completionCriteria:
        task.completionCriteria || "기존 과제를 완료 또는 보류로 정리함",
      source: task.source ?? "MIXED",
      priority: 78,
      dueDate: task.dueDate ?? endOfMonth(year, month),
      status: "TODO",
    });
  }

  // 4) 월운 행동 태그
  if (!fortune) {
    items.push({
      key: "fortune.generate",
      title: "올해 재물운 생성하기",
      category: "운세",
      reason:
        "운세 데이터가 없습니다. 운세 캘린더에서 참고용 데모 해석을 생성하면 월운 태그가 과제에 반영됩니다.",
      completionCriteria: "운세 캘린더에서 해당 연도 운세를 생성함",
      source: "FORTUNE",
      priority: 66,
      dueDate: endOfMonth(year, month),
    });
  } else {
    const current =
      fortune.monthly.find((m) => m.month === month) ?? fortune.monthly[0];
    if (current) {
      if (current.score >= 70) {
        items.push({
          key: `fortune.high.${year}.${current.month}`,
          title: `${current.month}월 조사·협상 준비·목표 구체화`,
          category: "월운",
          reason: safeText(
            `${current.tone}·${current.theme} (참고 ${current.score}). 월운이 상대적으로 높으니 조사 목록·협상 포인트·목표 문장을 준비하세요. 매매 지시가 아닙니다.`,
          ),
          completionCriteria: "조사 항목 3개와 목표 문장 1개를 기록함",
          source: "FORTUNE",
          priority: 64,
          dueDate: endOfMonth(year, current.month),
        });
      } else if (current.score < 55) {
        items.push({
          key: `fortune.low.${year}.${current.month}`,
          title: `${current.month}월 기록·계약 점검·현금흐름 정리`,
          category: "월운",
          reason: safeText(
            `${current.tone}·${current.theme} (참고 ${current.score}). 월운이 상대적으로 낮으니 기록 정리·계약 만기·현금흐름 점검을 우선하세요.`,
          ),
          completionCriteria: "계약·현금흐름 점검 메모를 남김",
          source: "FORTUNE",
          priority: 63,
          dueDate: endOfMonth(year, current.month),
        });
      } else {
        items.push({
          key: `fortune.mid.${year}.${current.month}`,
          title: `${current.month}월 ${current.tone} 톤 메모`,
          category: "월운",
          reason: safeText(
            `${current.theme}. 학습·기록·점검용으로 3줄 메모를 남기세요.`,
          ),
          completionCriteria: "월운 톤에 맞는 메모 3줄을 저장함",
          source: "FORTUNE",
          priority: 60,
          dueDate: endOfMonth(year, current.month),
        });
      }
    }

    if (!profile.birthTime) {
      items.push({
        key: "fortune.birth-time",
        title: "출생 시각 보완 검토(선택)",
        category: "프로필",
        reason:
          "시주가 미상일 수 있습니다. 알면 보완하고, 모르면 비워 두어도 됩니다.",
        completionCriteria: "출생 시각을 입력하거나 ‘모름’으로 메모함",
        source: "FORTUNE",
        priority: 55,
      });
    }
  }

  // 중복 방지: 기존 키와 신규 키
  const seen = new Set<string>();
  const result: Recommendation[] = [];
  for (const item of items.sort((a, b) => b.priority - a.priority)) {
    if (seen.has(item.key)) continue;
    // open.* 는 기존 과제의 재노출이므로 existingKeys 스킵 대상에서 제외
    if (!item.key.startsWith("open.") && existingKeys.has(item.key)) continue;
    seen.add(item.key);
    result.push({ ...item, reason: safeText(item.reason) });
  }

  return result.slice(0, 12);
}
