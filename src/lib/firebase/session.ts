import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  getFirebaseProjectId,
  isAuthConfigured,
} from "@/lib/firebase/config";

export const SESSION_COOKIE = "sajuai_session";
const SESSION_DAYS = 14;

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

/** Firebase ID 토큰 검증 (Admin SDK 없이 jose + Google JWKS) */
export async function verifyFirebaseIdToken(idToken: string) {
  const projectId = getFirebaseProjectId();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID_MISSING");

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
}

export async function createSessionCookie(idToken: string) {
  const user = await verifyFirebaseIdToken(idToken);
  const token = await new SignJWT({
    uid: user.uid,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(sessionSecret());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return user;
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isAuthConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
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

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    err.name = "UnauthorizedError";
    throw err;
  }
  return user;
}
