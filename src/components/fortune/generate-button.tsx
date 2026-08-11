"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GenerateFortuneButton({ year }: { year: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/fortune/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) throw new Error("failed");
      router.refresh();
    } catch {
      alert("운세 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" className="max-w-full" onClick={generate} disabled={loading}>
      <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">
        {loading ? "생성 중..." : `${year}년 운세 새로고침`}
      </span>
    </Button>
  );
}
