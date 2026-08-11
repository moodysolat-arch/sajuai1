# 재물 나침반 MVP — Implementation Checklist

**단일 요구사항 문서:** [`docs/mvp_plan.md`](./docs/mvp_plan.md)  
**원본 PDF:** [`fortune_asset_dashboard_mvp_plan.pdf`](./fortune_asset_dashboard_mvp_plan.pdf)

---

## 0. 범위

- [x] 단일 사용자 · 로그인 없음 · 데모 프로필 1명
- [x] 재무 지표와 사주 해석 UI 분리
- [x] 데모 운세 `provider: demo` + 면책
- [x] 오류 형식 `{ code, message, fieldErrors? }`
- [x] 금액 KRW 정수

---

## 1. 화면 · 라우트

- [x] 내비: 대시보드 · 운세 · 총자산 · 부동산 · 주식 · 현금 · 실행 과제 · 재물운 홈 · 재물 성향 · 설정
- [x] `/dashboard` KPI·배분·건강·우선 과제
- [x] `/` 재물운 홈
- [x] `/fortune` 사주·대운·세운·12개월
- [x] `/assets*` CRUD
- [x] `/wealth-type` 재물 성향
- [x] `/actions` 과제 완료/보류
- [x] `/settings` 프로필·금액숨김·운세 재생성·데모 초기화
- [x] `/onboarding` 신규 온보딩
- [x] 금액 숨김 토글 · 데모 초기화 · 기준일

---

## 2. 도메인 · API

- [x] 총자산·총부채·순자산 · 배분 · 건강점수
- [x] 자산 CRUD API
- [x] FortuneProvider / 데모 엔진
- [x] 성향: 설문50 + 구성30 + 현금흐름20
- [x] `buildRecommendations`
- [x] profile / fortune generate / actions / demo reset

---

## 3. UX · a11y

- [x] 360 / 768 / 1440 반응형
- [x] 포커스 표시 · dialog focus trap
- [x] 폼 label · 오류 연결
- [x] reduced motion
- [x] 로딩·오류·빈 상태
- [x] 고지 문구 (온보딩·운세·설정)

---

## 4. 검증

- [x] lint / typecheck / unit·integration / Playwright e2e / production build
- [x] Playwright: 대시보드 · 자산 CRUD · 운세 · 성향 · 과제 완료 · 데모 초기화

---

## 변경 이력

| 날짜 | 내용 |
| --- | --- |
| 2026-08-11 | PDF 기준 자산+사주 통합 체크리스트 |
| 2026-08-11 | 최종 검수: 구현 상태와 문서 재동기화 |
