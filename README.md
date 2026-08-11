# 재물 나침반 MVP

생년월일·자산 데이터를 바탕으로 **재무 현황**과 **참고용 사주 재물운**을 함께 보는 단일 사용자 Next.js 앱입니다.

- **요구사항:** [`docs/mvp_plan.md`](./docs/mvp_plan.md)
- **체크리스트:** [`IMPLEMENTATION_CHECKLIST.md`](./IMPLEMENTATION_CHECKLIST.md)
- **원본 PDF:** [`fortune_asset_dashboard_mvp_plan.pdf`](./fortune_asset_dashboard_mvp_plan.pdf)

## 제품 설명

- 대시보드: 총자산·부채·순자산, 배분, 재무 건강, 우선 과제
- 자산: 부동산·주식·현금 등 CRUD (금액은 원 단위 정수)
- 사주 재물운: 사주 요약·대운·세운·12개월 금전운 (데모 엔진)
- 재물 성향: 설문 50% + 자산 구성 30% + 현금흐름 20%
- 실행 과제: 학습·점검·기록 중심 (매매 지시 없음)
- 온보딩·설정·데모 초기화·금액 숨김
- **Firebase 이메일 로그인** + **Firestore 동기화** (계정별 데이터 분리)

## Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Authentication → Sign-in method → **Email/Password** 사용 설정
3. Firestore Database 생성 (프로덕션/테스트 모드)
4. 프로젝트 설정 → 일반 → 웹 앱 추가 → 클라이언트 키 복사
5. 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 (Admin)
6. `.env.example`을 참고해 `.env.local`에 값을 넣습니다.

```bash
# Client
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Admin (Firestore·세션 쿠키)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

- 로그인: `/login` (가입/로그인)
- 세션: HttpOnly 쿠키 `sajuai_session` (`SESSION_SECRET` + Firebase ID 토큰 검증)
- Prisma: 사용자별 `firebaseUid` / 자산 `profileId`
- Firestore: Admin 키가 있을 때 `users/{uid}` 등으로 동기화 (선택)

**배포 도메인 승인:** Firebase Console → Authentication → Settings → **Authorized domains**에  
`localhost`, `sajuai1.firebaseapp.com`, **`sajuai1.vercel.app`** 가 있어야 브라우저 로그인이 됩니다.

Firebase 없이 로컬만 돌릴 때: `AUTH_BYPASS=1` (데모 프로필 사용)

## 설치 및 실행

```bash
npm install
npx prisma generate
npx prisma migrate reset --force
npm run db:seed
npm run dev
```

브라우저: [http://localhost:3000/login](http://localhost:3000/login)

깨끗한 DB만 필요할 때:

```bash
npx prisma migrate deploy
npm run db:seed
```

## migration · seed · reset

| 명령 | 설명 |
| --- | --- |
| `npx prisma generate` | Prisma Client 생성 |
| `npx prisma migrate deploy` | 마이그레이션 적용 |
| `npx prisma migrate reset --force` | DB 삭제 후 마이그레이션+시드 |
| `npm run db:seed` | 데모 데이터 시드 (멱등) |
| `npm run db:verify` | 시드 검증 |

## 테스트 명령

```bash
npm run lint
npm run typecheck
npm run test
npx playwright install chromium   # 최초 1회
npm run test:e2e
npm run build
```

## 데모 사용법

1. 시드 후 `/dashboard`에서 데모 자산·KPI 확인
2. 온보딩 화면의 **데모로 둘러보기**로도 동일 데이터 진입 가능
3. 헤더 **데모 초기화** 또는 설정 → 데모 데이터 초기화 (확인 모달)
4. 금액 숨김 토글·설정의 금액 숨김 기본값으로 금액 마스킹

## 데모 운세 엔진의 한계

- `provider: demo` — 결정적 해시 기반 참고용 해석이며 **실제 만세력·명리학 계산이 아닙니다**
- 출생 시각이 없으면 시주는 `미상`으로 표시됩니다
- 수익 예측·투자 타이밍 보장을 하지 않습니다

## 실제 만세력 API 교체 위치

`src/services/fortune/index.ts`

1. `FortuneProvider` 구현체를 새 파일에 작성 (예: `manseryeok-provider.ts`)
2. `getFortuneProvider`가 반환하는 인스턴스를 교체하거나 `setFortuneProvider` 호출
3. `FortuneResult` 계약(`src/services/fortune/types.ts`)은 유지

## 금융 자문이 아니라는 고지

본 서비스의 사주·운세 정보는 자기이해와 생활 계획을 위한 참고용 해석이며, 미래 수익을 보장하거나 금융·투자·세무·법률 자문을 제공하지 않습니다.

(온보딩·운세·설정 화면에 동일 문구 표시)

## 향후 확장 범위

- 실제 만세력/사주 API 연동
- 시세·환율 자동 갱신
- 멀티 프로필·인증
- 알림·리마인더
- 고급 리포트·내보내기

## 스택

Next.js App Router · TypeScript · Tailwind · Prisma/SQLite · Zod · Vitest · Playwright
