/** firebase-admin 없이 설정 여부만 판별 (SSR 안전) */
export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

/** Firebase Admin 미설정 또는 AUTH_BYPASS=1 이면 데모 모드 */
export function isAuthBypassed() {
  return process.env.AUTH_BYPASS === "1" || !isFirebaseAdminConfigured();
}
