/** 브라우저/서버 공통: Firebase 클라이언트(프로젝트) 설정 여부 */
export function isFirebaseClientConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
}

export function getFirebaseProjectId() {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    ""
  );
}

/** firebase-admin 서비스 계정 (Firestore 서버 동기화용, 로그인에는 불필요) */
export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

/** 로그인 사용 가능: 클라이언트 Firebase + 세션 시크릿 */
export function isAuthConfigured() {
  return (
    isFirebaseClientConfigured() && Boolean(process.env.SESSION_SECRET?.length)
  );
}

/** AUTH_BYPASS=1 이거나 로그인 설정이 없으면 데모 모드 */
export function isAuthBypassed() {
  return process.env.AUTH_BYPASS === "1" || !isAuthConfigured();
}
