/**
 * ADMIN_EMAIL / ADMIN_PASSWORD / NEXT_PUBLIC_FIREBASE_API_KEY 로
 * Firebase Email/Password 관리자 계정을 생성(또는 이미 있으면 로그인 확인).
 *
 *   npm run admin:ensure
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env) || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

const email = (process.env.ADMIN_EMAIL ?? "").trim();
const password = process.env.ADMIN_PASSWORD ?? "";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

if (!email || !password || !apiKey) {
  console.error(
    "[admin:ensure] ADMIN_EMAIL, ADMIN_PASSWORD, NEXT_PUBLIC_FIREBASE_API_KEY 가 필요합니다.",
  );
  process.exit(1);
}

const base = `https://identitytoolkit.googleapis.com/v1/accounts`;

async function signUp() {
  const res = await fetch(`${base}:signUp?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function signIn() {
  const res = await fetch(`${base}:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

const created = await signUp();
if (created.ok) {
  console.log("[admin:ensure] 관리자 계정 생성됨:", email, "uid=", created.data.localId);
  process.exit(0);
}

const code = created.data?.error?.message ?? "";
if (code === "EMAIL_EXISTS") {
  const login = await signIn();
  if (login.ok) {
    console.log("[admin:ensure] 이미 존재 · 비밀번호로 로그인 확인됨:", email);
    process.exit(0);
  }
  console.error(
    "[admin:ensure] 이메일은 있으나 ADMIN_PASSWORD 로 로그인 실패.",
    login.data?.error?.message ?? login.status,
  );
  process.exit(1);
}

console.error("[admin:ensure] 생성 실패:", code || created.status, created.data);
process.exit(1);
