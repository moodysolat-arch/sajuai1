/** 앱 관리자 계정 (env로 지정). 비밀번호는 Firebase Auth에만 두고 env에는 보관용. */

export function getAdminEmail() {
  return (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined) {
  const admin = getAdminEmail();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin;
}

export function getAdminPasswordFromEnv() {
  return process.env.ADMIN_PASSWORD ?? "";
}
