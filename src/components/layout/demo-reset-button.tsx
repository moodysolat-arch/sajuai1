"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DemoResetButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function reset() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error("reset failed");
      setOpen(false);
      router.refresh();
    } catch {
      alert("초기화에 실패했습니다. 터미널에서 npm run db:seed 를 실행해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">데모 초기화</span>
      </Button>
      <ConfirmDialog
        open={open}
        title="데모 데이터를 초기화할까요?"
        description="현재 변경 사항이 사라지고 시드 데이터로 돌아갑니다."
        confirmLabel="초기화"
        cancelLabel="취소"
        busy={loading}
        onConfirm={reset}
        onCancel={() => !loading && setOpen(false)}
      />
    </>
  );
}
