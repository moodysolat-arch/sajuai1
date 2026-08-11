import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, fail, handleRouteError } from "@/lib/api";
import { ensureUserProfile } from "@/lib/auth";
import { isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  clearSessionCookie,
  createSessionCookie,
  getSessionUser,
} from "@/lib/firebase/session";
import { getAdminAuth } from "@/lib/firebase/admin";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

export async function GET() {
  try {
    if (!isFirebaseAdminConfigured()) {
      return ok({
        configured: false,
        user: null,
        message: "Firebase Admin 환경 변수가 없습니다.",
      });
    }
    const user = await getSessionUser();
    return ok({ configured: true, user });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return fail(
        "FIREBASE_NOT_CONFIGURED",
        "Firebase Admin 환경 변수를 설정해 주세요.",
        503,
      );
    }
    const { idToken } = bodySchema.parse(await request.json());
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    await createSessionCookie(idToken);
    const profile = await ensureUserProfile({
      uid: decoded.uid,
      email: decoded.email ?? null,
    });
    return ok({
      user: { uid: decoded.uid, email: decoded.email ?? null },
      profileId: profile.id,
      onboardingCompleted: profile.onboardingCompleted,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
