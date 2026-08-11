import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ensureDemoDatabase } from "@/lib/db-bootstrap";
import { isAuthBypassed, isAuthConfigured } from "@/lib/firebase/config";
import type { SessionUser } from "@/lib/firebase/session";

export type { SessionUser };
export { isAuthBypassed, isAuthConfigured };

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isAuthBypassed()) return null;
  const { getSessionUser: readSession } = await import("@/lib/firebase/session");
  return readSession();
}

export async function requireSessionUser(): Promise<SessionUser> {
  if (isAuthBypassed()) {
    const err = new Error("UNAUTHORIZED");
    err.name = "UnauthorizedError";
    throw err;
  }
  const { requireSessionUser: requireSession } = await import(
    "@/lib/firebase/session"
  );
  return requireSession();
}

async function syncProfile(uid: string, email: string | null, profile: {
  id: string;
  name: string;
  calendarType: string;
  birthDate: string;
  birthTime: string | null;
  timezone: string;
  riskLevel: string;
  goal: string;
  monthlyExpense: number;
  preferredActivity: string;
  investmentHorizon: string;
  onboardingCompleted: boolean;
  isDemo: boolean;
  maskDefault: boolean;
  updatedAt: Date;
}) {
  const { syncProfileToFirestore } = await import("@/lib/firestore/user-store");
  await syncProfileToFirestore({ uid, email, profile });
}

export async function ensureUserProfile(user: SessionUser) {
  await ensureDemoDatabase();
  const admin = isAdminEmail(user.email);

  const existing = await prisma.userProfile.findUnique({
    where: { firebaseUid: user.uid },
  });
  if (existing) {
    const needsUnlock = !existing.onboardingCompleted;
    const emailChanged = Boolean(user.email && existing.email !== user.email);
    if (needsUnlock || emailChanged) {
      const updated = await prisma.userProfile.update({
        where: { id: existing.id },
        data: {
          ...(emailChanged ? { email: user.email } : {}),
          ...(needsUnlock
            ? {
                onboardingCompleted: true,
                isDemo: false,
                name: admin
                  ? existing.name || "관리자"
                  : existing.name,
                goal:
                  existing.goal === "재무 목표를 입력해 주세요"
                    ? admin
                      ? "관리자 계정"
                      : existing.goal
                    : existing.goal,
              }
            : {}),
        },
      });
      await syncProfile(user.uid, user.email, updated);
      return updated;
    }
    return existing;
  }

  const profile = await prisma.userProfile.create({
    data: {
      firebaseUid: user.uid,
      email: user.email,
      name: admin ? "관리자" : user.email?.split("@")[0] || "새 사용자",
      calendarType: "SOLAR",
      birthDate: "1990-01-01",
      birthTime: null,
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      goal: admin ? "관리자 계정" : "재무 목표를 입력해 주세요",
      monthlyExpense: 2_000_000,
      preferredActivity: "LEARNING",
      investmentHorizon: "Y3_TO_7",
      // 신규 계정도 바로 종합 재물운 사용 (온보딩은 설정에서 보완)
      onboardingCompleted: true,
      isDemo: false,
      maskDefault: false,
    },
  });

  await syncProfile(user.uid, user.email, profile);
  return profile;
}

/**
 * 현재 로그인 사용자 프로필.
 * Firebase 미설정/AUTH_BYPASS 시 데모 프로필.
 */
export async function getCurrentProfile() {
  await ensureDemoDatabase();
  if (isAuthBypassed()) {
    const profile = await prisma.userProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!profile) throw new Error("DEFAULT_PROFILE_MISSING");
    return profile;
  }

  const user = await requireSessionUser();
  return ensureUserProfile(user);
}

export async function getOptionalProfile() {
  await ensureDemoDatabase();
  if (isAuthBypassed()) {
    return prisma.userProfile.findFirst({ orderBy: { createdAt: "asc" } });
  }
  const user = await getSessionUser();
  if (!user) return null;
  return ensureUserProfile(user);
}
