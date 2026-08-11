import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, fail, handleRouteError } from "@/lib/api";
import { ensureUserProfile } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/firebase/config";
import {
  clearSessionCookie,
  createSessionCookie,
  getSessionUser,
} from "@/lib/firebase/session";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

export async function GET() {
  try {
    if (!isAuthConfigured()) {
      return ok({
        configured: false,
        user: null,
        message: "Firebase 클라이언트/SESSION_SECRET 환경 변수가 없습니다.",
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
    if (!isAuthConfigured()) {
      return fail(
        "AUTH_NOT_CONFIGURED",
        "Firebase 클라이언트와 SESSION_SECRET을 설정해 주세요.",
        503,
      );
    }
    const { idToken } = bodySchema.parse(await request.json());
    const user = await createSessionCookie(idToken);
    const profile = await ensureUserProfile(user);
    return ok({
      user,
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
