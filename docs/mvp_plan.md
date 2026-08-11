# 재물 나침반 MVP 기획서

**상태:** 현재 유효한 **단일 요구사항 문서**  
**원본 PDF:** [`fortune_asset_dashboard_mvp_plan.pdf`](../fortune_asset_dashboard_mvp_plan.pdf)  
**체크리스트:** [`IMPLEMENTATION_CHECKLIST.md`](../IMPLEMENTATION_CHECKLIST.md)

---

## 0. 제품 정의

**재물 나침반** — 개인 자산 데이터와 참고용 사주 재물운을 한곳에서 보고, 자기이해·생활 계획용 실행 과제를 관리하는 단일 사용자 MVP.

- 로그인 없음 · 데모 프로필 1명  
- 재무 지표와 사주 해석을 UI·카피에서 분리  
- 사주 = 참고용 (`provider: demo`), 투자·세무·법률 자문 아님  

---

## 1. 화면 · 라우트

| 라우트 | 화면 |
| --- | --- |
| `/dashboard` | 총자산·부채·순자산, 배분, 재무 건강, 우선 과제 |
| `/` | 재물운 홈 (성향·월 톤·과제·12개월) |
| `/fortune` | 사주·대운·세운·12개월 금전운 |
| `/assets*` | 자산 CRUD (총자산·부동산·주식·현금·상세) |
| `/wealth-type` | 재물 성향 (설문50 + 구성30 + 현금흐름20) |
| `/actions` | 실행 과제 (완료/보류/재시작) |
| `/settings` | 프로필·금액숨김 기본값·운세 재생성·데모 초기화 |
| `/onboarding` | 신규 사용자 온보딩 |

**내비:** 대시보드 · 운세 캘린더 · 총 자산 · 부동산 · 주식 · 현금 · 실행 과제 · 재물운 홈 · 재물 성향 · 설정  

---

## 2. 핵심 흐름

1. 온보딩 또는 데모로 둘러보기  
2. 대시보드에서 KPI·배분·건강·과제 확인  
3. 자산 추가·수정·삭제  
4. 운세 생성 후 캘린더·성향 확인  
5. 실행 과제 완료/보류  
6. 설정에서 데모 초기화  

---

## 3. 데이터

`UserProfile`, `Asset`(+detail), `ValuationSnapshot`, `FortuneSnapshot`, `ActionTask`  
금액: KRW 정수(`Int`).

---

## 4. 로직

- **재무:** 총자산·부채·순자산, 배분, 집중도, 현금흐름, 비상자금개월, 건강점수  
- **사주:** `FortuneProvider` → 데모 엔진 (`src/services/fortune/index.ts`에서 교체)  
- **성향:** 설문 50% + 자산구성 30% + 현금흐름 20% (사주는 키워드만)  
- **과제:** `buildRecommendations` (안전 규칙 우선, 매매 지시 금지)  

---

## 5. 필수 고지

본 서비스의 사주·운세 정보는 자기이해와 생활 계획을 위한 참고용 해석이며, 미래 수익을 보장하거나 금융·투자·세무·법률 자문을 제공하지 않습니다.

---

## 6. Definition of Done

- [ ] 주요 화면 360/768/1440 가로 스크롤 없음  
- [ ] lint / typecheck / unit / e2e / production build 통과  
- [ ] Playwright: 대시보드·자산 CRUD·운세·성향·과제 완료·데모 초기화  
