"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

export type ActionView = {
  id: string;
  title: string;
  category: string;
  reason: string;
  completionCriteria: string;
  dueDate: string | null;
  status: "TODO" | "DONE" | "SNOOZED";
  source: "FINANCE" | "FORTUNE" | "MIXED";
  memo: string | null;
  dedupeKey: string;
};

const STATUS_LABEL = {
  TODO: "진행",
  DONE: "완료",
  SNOOZED: "보류",
} as const;

export function ActionCard({ action }: { action: ActionView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [memo, setMemo] = useState(action.memo ?? "");
  const [message, setMessage] = useState("");

  async function patch(body: { status?: ActionView["status"]; memo?: string | null }) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/actions/${action.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message ?? "저장 실패");
        return;
      }
      setMessage(body.memo !== undefined ? "메모를 저장했습니다." : "상태를 변경했습니다.");
      router.refresh();
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">{action.title}</CardTitle>
          <CardDesc>
            {action.category} · {STATUS_LABEL[action.status]} · {action.source}
            {action.dueDate ? ` · ~${action.dueDate}` : ""}
          </CardDesc>
        </div>
        <div className="flex flex-wrap gap-2">
          {action.status !== "DONE" ? (
            <Button type="button" disabled={busy} onClick={() => patch({ status: "DONE" })}>
              완료
            </Button>
          ) : null}
          {action.status !== "SNOOZED" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => patch({ status: "SNOOZED" })}
            >
              보류
            </Button>
          ) : null}
          {action.status !== "TODO" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => patch({ status: "TODO" })}
            >
              다시 시작
            </Button>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/70">{action.reason}</p>
      {action.completionCriteria ? (
        <p className="mt-2 text-xs text-ink/50">완료 조건: {action.completionCriteria}</p>
      ) : null}
      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-ink/65">메모</span>
        <textarea
          className="input min-h-20"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={busy}
        />
      </label>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => patch({ memo })}
        >
          메모 저장
        </Button>
        {message ? <span className="text-xs text-ink/55">{message}</span> : null}
      </div>
    </Card>
  );
}
