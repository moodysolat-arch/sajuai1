import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

const SESSION_COOKIE = "sajuai_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Firebase 미설정 로컬 개발: AUTH_BYPASS 또는 Admin 미구성 시 게이트 생략
  // (엣지에서는 Admin SDK를 쓰지 않으므로 쿠키 유무만 검사; bypass는 env로)
  if (process.env.AUTH_BYPASS === "1") {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isPublic) return NextResponse.next();

  // 정적 파일
  if (pathname.includes(".")) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // Firebase Admin이 없으면 미들웨어에서 강제하지 않음 (서버 페이지가 바이패스)
  if (!process.env.FIREBASE_PROJECT_ID) {
    return NextResponse.next();
  }

  if (!hasSession && !pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
