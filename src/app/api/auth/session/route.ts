import { NextResponse } from "next/server";
import { z } from "zod";
import { ok, fail, handleRouteError } from "@/lib/api";
import { ensureUserProfile } from "@/lib/auth";
import { isAuthConfigured } from "@/lib/firebase/config";
import {
  SESSION_COOKIE,
  getSessionUser,
  sessionCookieOptions,
  signSessionToken,
  verifyFirebaseIdToken,
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
    const user = await verifyFirebaseIdToken(idToken);
    const profile = await ensureUserProfile(user);
    const sessionToken = await signSessionToken(user);

    const res = NextResponse.json({
      user,
      profileId: profile.id,
      onboardingCompleted: profile.onboardingCompleted,
    });
    // Route Handler에서는 응답 객체에 쿠키를 붙여야 브라우저에 확실히 전달됨
    res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
    return res;
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ID_TOKEN") {
      return fail(
        "INVALID_TOKEN",
        "로그인 토큰이 올바르지 않습니다. 다시 로그인해 주세요.",
        401,
      );
    }
    return handleRouteError(error);
  }
}

export async function DELETE() {
  try {
    const res = new NextResponse(null, { status: 204 });
    res.cookies.set(SESSION_COOKIE, "", {
      ...sessionCookieOptions(),
      maxAge: 0,
    });
    return res;
  } catch (error) {
    return handleRouteError(error);
  }
}
