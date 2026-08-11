"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssetForm } from "@/components/assets/asset-form";
import type { AssetListItem } from "@/components/assets/asset-types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function AssetDetailClient({ asset }: { asset: AssetListItem }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ tone: "err", text: data.message ?? "삭제 실패" });
        setDeleting(false);
        return;
      }
      router.push("/assets");
      router.refresh();
    } catch {
      setFeedback({ tone: "err", text: "네트워크 오류" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {feedback ? (
        <div
          role="status"
          className={
            feedback.tone === "ok"
              ? "rounded-[12px] border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
              : "rounded-[12px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          }
        >
          {feedback.text}
        </div>
      ) : null}

      <Card className="p-5">
        <AssetForm
          mode="edit"
          asset={asset}
          onSuccess={() => {
            setFeedback({ tone: "ok", text: "저장되었습니다." });
            router.refresh();
          }}
        />
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => setDeleting(true)}>
          삭제
        </Button>
      </div>

      <ConfirmDialog
        open={deleting}
        title="자산 삭제"
        description={`"${asset.name}"을(를) 삭제할까요?`}
        confirmLabel="삭제"
        busy={busy}
        onCancel={() => !busy && setDeleting(false)}
        onConfirm={onDelete}
      />
    </>
  );
}
