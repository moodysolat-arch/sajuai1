"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { getClientAuth, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      if (isFirebaseClientConfigured()) {
        await signOut(getClientAuth()).catch(() => undefined);
      }
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={logout}
      disabled={busy}
      aria-label="로그아웃"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{busy ? "…" : "로그아웃"}</span>
    </Button>
  );
}
