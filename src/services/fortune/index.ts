import { DemoFortuneProvider } from "./demo-provider";
import type { FortuneProvider } from "./types";

/**
 * 기본 공급자: DemoFortuneProvider
 *
 * 실제 만세력 API로 교체할 위치:
 * 1. `FortuneProvider` 구현체를 새 파일에 작성 (예: `manseryeok-provider.ts`)
 * 2. 아래 `provider` 초기값을 교체하거나 앱 부트스트랩에서 `setFortuneProvider` 호출
 * 3. `types.ts`의 `FortuneResult` 계약은 유지
 */
let provider: FortuneProvider = new DemoFortuneProvider();

export function getFortuneProvider() {
  return provider;
}

export function setFortuneProvider(next: FortuneProvider) {
  provider = next;
}

export type {
  FortuneProvider,
  FortuneProfileInput,
  FortuneResult,
  FortunePillar,
  DecadeCycle,
  MonthlyFortune,
  FiveElement,
} from "./types";

export { FIVE_ELEMENTS } from "./types";
export { DemoFortuneProvider, hashSeed, buildElementWeights, buildDecadeCycles } from "./demo-provider";
export { toFortuneCalendarView, DEMO_BADGE } from "./mapper";
export type { FortuneCalendarViewModel, FortuneElementBar } from "./mapper";
