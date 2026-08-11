"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getClientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

type Mode = "login" | "signup";

function safeNextPath(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.startsWith("/login")) return null;
  return raw;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const configured = isFirebaseClientConfigured();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setError("");
    try {
      const auth = getClientAuth();
      const cred =
        mode === "signup"
          ? await createUserWithEmailAndPassword(auth, email.trim(), password)
          : await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "세션 생성에 실패했습니다.");
        setBusy(false);
        return;
      }
      const next = safeNextPath(searchParams.get("next"));
      // 로그인 성공 시 항상 종합 재물운(/dashboard)으로.
      // next=/onboarding 이면 온보딩 루프에 빠지므로 제외.
      const dest =
        next && next !== "/onboarding" && next !== "/"
          ? next
          : "/dashboard";
      window.location.assign(dest);
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "auth/email-already-in-use") {
        setError("이미 가입된 이메일입니다. 로그인으로 전환해 보세요.");
      } else if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (code === "auth/weak-password") {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else if (code === "auth/invalid-email") {
        setError("이메일 형식을 확인해 주세요.");
      } else if (code === "auth/unauthorized-domain") {
        setError(
          "이 도메인이 Firebase 승인 목록에 없습니다. Console → Authentication → Settings → Authorized domains에 sajuai1.vercel.app 을 추가해 주세요.",
        );
      } else if (code === "auth/operation-not-allowed") {
        setError(
          "Email/Password 로그인이 비활성화되어 있습니다. Firebase Console에서 사용 설정해 주세요.",
        );
      } else {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <Card>
        <CardTitle>Firebase 설정 필요</CardTitle>
        <CardDesc>
          `.env.local`에 `NEXT_PUBLIC_FIREBASE_*` 와 `SESSION_SECRET`을 넣은 뒤
          서버를 재시작해 주세요.
        </CardDesc>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{mode === "login" ? "이메일 로그인" : "회원가입"}</CardTitle>
      <CardDesc>
        Firebase Authentication · 계정별로 프로필과 운세 데이터가 저장됩니다.
      </CardDesc>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1.5 block text-ink/65">이메일</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-ink/65">비밀번호</span>
          <input
            className="input"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-ink/60">
        {mode === "login" ? (
          <>
            계정이 없나요?{" "}
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
            >
              회원가입
            </button>
          </>
        ) : (
          <>
            이미 계정이 있나요?{" "}
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              로그인
            </button>
          </>
        )}
      </p>
      <p className="mt-3 text-xs text-ink/45">
        <Link href="/" className="text-primary hover:underline">
          홈으로
        </Link>
      </p>
    </Card>
  );
}
