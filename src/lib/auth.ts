import { prisma } from "@/lib/prisma";
import {
  getSessionUser,
  requireSessionUser,
  type SessionUser,
} from "@/lib/firebase/session";
import { syncProfileToFirestore } from "@/lib/firestore/user-store";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export { getSessionUser, requireSessionUser, type SessionUser };

/** 개발용: Firebase 미설정 시 기존 단일 데모 프로필로 동작 */
export function isAuthBypassed() {
  return process.env.AUTH_BYPASS === "1" || !isFirebaseAdminConfigured();
}

export async function ensureUserProfile(user: SessionUser) {
  const existing = await prisma.userProfile.findUnique({
    where: { firebaseUid: user.uid },
  });
  if (existing) {
    if (user.email && existing.email !== user.email) {
      const updated = await prisma.userProfile.update({
        where: { id: existing.id },
        data: { email: user.email },
      });
      await syncProfileToFirestore({
        uid: user.uid,
        email: user.email,
        profile: updated,
      });
      return updated;
    }
    return existing;
  }

  const profile = await prisma.userProfile.create({
    data: {
      firebaseUid: user.uid,
      email: user.email,
      name: user.email?.split("@")[0] || "새 사용자",
      calendarType: "SOLAR",
      birthDate: "1990-01-01",
      birthTime: null,
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      goal: "재무 목표를 입력해 주세요",
      monthlyExpense: 2_000_000,
      preferredActivity: "LEARNING",
      investmentHorizon: "Y3_TO_7",
      onboardingCompleted: false,
      isDemo: false,
      maskDefault: false,
    },
  });

  await syncProfileToFirestore({
    uid: user.uid,
    email: user.email,
    profile,
  });
  return profile;
}

/**
 * 현재 로그인 사용자 프로필.
 * Firebase 미설정/AUTH_BYPASS 시 기존 데모(가장 오래된) 프로필.
 */
export async function getCurrentProfile() {
  if (isAuthBypassed()) {
    const profile = await prisma.userProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!profile) throw new Error("DEFAULT_PROFILE_MISSING");
    return profile;
  }

  const user = await requireSessionUser();
  const profile = await ensureUserProfile(user);
  return profile;
}

export async function getOptionalProfile() {
  if (isAuthBypassed()) {
    return prisma.userProfile.findFirst({ orderBy: { createdAt: "asc" } });
  }
  const user = await getSessionUser();
  if (!user) return null;
  return ensureUserProfile(user);
}
