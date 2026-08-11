/**
 * 앱 공통 타입 진입점.
 * 도메인 타입은 `@/domain/types` · `@/domain/enums`에 정의하고 여기서 재수출한다.
 */
export type {
  WealthType,
  WealthTypeResult,
  FinanceSummary,
  Recommendation,
  FortunePillar,
  DecadeCycle,
  MonthlyFortune,
  FortuneResult,
} from "@/domain/types";

export type {
  CalendarType,
  RiskLevel,
  AssetType,
  ActionStatus,
  ActionSource,
} from "@/domain/enums";

export {
  CALENDAR_TYPES,
  RISK_LEVELS,
  ASSET_TYPES,
  ACTION_STATUSES,
  ACTION_SOURCES,
  ASSET_TYPE_LABELS,
} from "@/domain/enums";
