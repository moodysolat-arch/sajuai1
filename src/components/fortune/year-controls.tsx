"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FortuneYearControls({
  year,
  years,
}: {
  year: number;
  years: number[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onYearChange(next: number) {
    startTransition(() => {
      router.push(`/fortune?year=${next}`);
    });
  }

  async function regenerate() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/fortune/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "운세 생성에 실패했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <span className="sr-only">연도 선택</span>
        <select
          className="input w-auto"
          value={year}
          disabled={pending || busy}
          onChange={(e) => onYearChange(Number(e.target.value))}
          aria-label="운세 연도"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </label>
      <Button type="button" onClick={regenerate} disabled={busy || pending}>
        <Sparkles className="h-4 w-4" aria-hidden />
        {busy ? "생성 중..." : "다시 생성"}
      </Button>
      {error ? (
        <span className="text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
