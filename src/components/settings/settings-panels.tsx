"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMask } from "@/components/layout/mask-context";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

export function MaskDefaultPanel({ maskDefault }: { maskDefault: boolean }) {
  const router = useRouter();
  const { setMasked } = useMask();
  const [value, setValue] = useState(maskDefault);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(next: boolean) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setValue(next);
    setMasked(next);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maskDefault: next }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message ?? "저장 실패");
        return;
      }
      setMessage("금액 숨김 기본값을 저장했습니다.");
      router.refresh();
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle>금액 숨김 기본값</CardTitle>
      <CardDesc>앱을 열 때 금액을 가린 상태로 시작합니다.</CardDesc>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value}
          disabled={busy}
          onChange={(e) => save(e.target.checked)}
        />
        금액 숨김을 기본으로 사용
      </label>
      {message ? <p className="mt-2 text-xs text-ink/55">{message}</p> : null}
    </Card>
  );
}

export function FortuneRegenPanel({ year }: { year: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function regenerate() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/fortune/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "생성 실패");
        return;
      }
      setMessage(`${year}년 운세를 다시 생성했습니다.`);
      router.refresh();
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle>운세 다시 생성</CardTitle>
      <CardDesc>현재 프로필로 {year}년 참고용 데모 운세를 다시 만듭니다.</CardDesc>
      <Button className="mt-4" type="button" onClick={regenerate} disabled={busy}>
        {busy ? "생성 중..." : "운세 다시 생성"}
      </Button>
      {message ? <p className="mt-2 text-xs text-ink/55">{message}</p> : null}
    </Card>
  );
}

export function DemoResetPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function reset() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (!res.ok) throw new Error("fail");
      setOpen(false);
      setMessage("데모 데이터를 초기화했습니다.");
      router.refresh();
    } catch {
      setMessage("초기화에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardTitle>데모 데이터 초기화</CardTitle>
      <CardDesc>시드 데모 자산·운세·과제로 되돌립니다. 확인 모달이 필요합니다.</CardDesc>
      <Button
        className="mt-4"
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        disabled={busy}
      >
        데모 데이터 초기화
      </Button>
      {message ? <p className="mt-2 text-xs text-ink/55">{message}</p> : null}
      <ConfirmDialog
        open={open}
        title="데모 데이터를 초기화할까요?"
        description="현재 변경 사항이 사라지고 시드 데모 데이터로 돌아갑니다."
        confirmLabel="초기화"
        cancelLabel="취소"
        busy={busy}
        onConfirm={reset}
        onCancel={() => !busy && setOpen(false)}
      />
    </Card>
  );
}
