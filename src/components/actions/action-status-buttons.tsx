"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ActionStatusButtons({
  id,
  status,
}: {
  id: string;
  status: "TODO" | "DONE" | "SNOOZED";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: "TODO" | "DONE" | "SNOOZED") {
    setLoading(true);
    try {
      await fetch(`/api/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "DONE" && (
        <Button disabled={loading} onClick={() => setStatus("DONE")}>
          완료
        </Button>
      )}
      {status !== "SNOOZED" && (
        <Button variant="secondary" disabled={loading} onClick={() => setStatus("SNOOZED")}>
          미루기
        </Button>
      )}
      {status !== "TODO" && (
        <Button variant="ghost" disabled={loading} onClick={() => setStatus("TODO")}>
          다시 시작
        </Button>
      )}
    </div>
  );
}
