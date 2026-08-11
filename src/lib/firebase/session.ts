import { createRemoteJWKSet, jwtVerify, SignJWT, errors as JoseErrors } from "jose";
import {
  getFirebaseProjectId,
  isAuthConfigured,
} from "@/lib/firebase/config";

export const SESSION_COOKIE = "sajuai_session";
export const SESSION_MAX_AGE = 14 * 24 * 60 * 60;

export type SessionUser = {
  uid: string;
  email: string | null;
};

const googleJwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

function sessionSecret() {
  const raw = process.env.SESSION_SECRET;
  if (!raw) throw new Error("SESSION_SECRET_MISSING");
  return new TextEncoder().encode(raw);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** Firebase ID 토큰 검증 (Admin SDK 없이 jose + Google JWKS) */
export async function verifyFirebaseIdToken(idToken: string) {
  const projectId = getFirebaseProjectId();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID_MISSING");

  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = typeof payload.sub === "string" ? payload.sub : null;
    if (!uid) throw new Error("INVALID_ID_TOKEN");

    return {
      uid,
      email: typeof payload.email === "string" ? payload.email : null,
    } satisfies SessionUser;
  } catch (error) {
    if (
      error instanceof JoseErrors.JOSEError ||
      (error instanceof Error &&
        /JWS|JWT|claim|signature|compact/i.test(error.message))
    ) {
      const err = new Error("INVALID_ID_TOKEN");
      err.name = "InvalidTokenError";
      throw err;
    }
    throw error;
  }
}

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({
    uid: user.uid,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionSecret());
}

export async function readSessionUserFromToken(
  token: string | undefined,
): Promise<SessionUser | null> {
  if (!token || !isAuthConfigured()) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const uid = typeof payload.uid === "string" ? payload.uid : null;
    if (!uid) return null;
    return {
      uid,
      email: typeof payload.email === "string" ? payload.email : null,
    };
  } catch {
    return null;
  }
}

/** @deprecated prefer route handlers that set cookies on NextResponse */
export async function createSessionCookie(idToken: string) {
  const { cookies } = await import("next/headers");
  const user = await verifyFirebaseIdToken(idToken);
  const token = await signSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions());
  return user;
}

export async function clearSessionCookie() {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isAuthConfigured()) return null;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return readSessionUserFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    err.name = "UnauthorizedError";
    throw err;
  }
  return user;
}
