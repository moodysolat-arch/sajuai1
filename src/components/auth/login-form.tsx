"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getClientAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

type Mode = "login" | "signup";

export function LoginForm() {
  const router = useRouter();
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
        return;
      }
      router.replace(data.onboardingCompleted ? "/dashboard" : "/onboarding");
      router.refresh();
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
      } else {
        setError("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <Card>
        <CardTitle>Firebase 설정 필요</CardTitle>
        <CardDesc>
          `.env.local`에 `NEXT_PUBLIC_FIREBASE_*` 와 Admin 키를 넣은 뒤 서버를
          재시작해 주세요. 자세한 항목은 README를 참고하세요.
        </CardDesc>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{mode === "login" ? "이메일 로그인" : "회원가입"}</CardTitle>
      <CardDesc>
        Firebase Authentication · 데이터는 계정별로 Prisma + Firestore에 저장됩니다.
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
