export const CALENDAR_TYPES = ["SOLAR", "LUNAR"] as const;
export type CalendarType = (typeof CALENDAR_TYPES)[number];

export const RISK_LEVELS = ["CONSERVATIVE", "BALANCED", "GROWTH"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const ASSET_TYPES = [
  "REAL_ESTATE",
  "STOCK",
  "CASH",
  "BUSINESS",
  "OTHER",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ACTION_STATUSES = ["TODO", "DONE", "SNOOZED"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const ACTION_SOURCES = ["FINANCE", "FORTUNE", "MIXED"] as const;
export type ActionSource = (typeof ACTION_SOURCES)[number];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  REAL_ESTATE: "부동산",
  STOCK: "주식",
  CASH: "현금",
  BUSINESS: "사업",
  OTHER: "기타",
};

export const PREFERRED_ACTIVITIES = [
  "LEARNING",
  "SAVING",
  "INVESTING",
  "BUSINESS_BUILD",
] as const;
export type PreferredActivity = (typeof PREFERRED_ACTIVITIES)[number];

export const INVESTMENT_HORIZONS = ["UNDER_3Y", "Y3_TO_7", "OVER_7Y"] as const;
export type InvestmentHorizon = (typeof INVESTMENT_HORIZONS)[number];

export const PREFERRED_ACTIVITY_LABELS: Record<PreferredActivity, string> = {
  LEARNING: "학습·정보 정리",
  SAVING: "저축·버퍼 쌓기",
  INVESTING: "시장 학습·분산 탐색",
  BUSINESS_BUILD: "사업·소득 다각화",
};

export const INVESTMENT_HORIZON_LABELS: Record<InvestmentHorizon, string> = {
  UNDER_3Y: "3년 미만",
  Y3_TO_7: "3~7년",
  OVER_7Y: "7년 이상",
};
