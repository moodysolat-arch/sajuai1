"use client";

import { useState } from "react";
import type { FortuneResult, WealthTypeResult } from "@/domain/types";
import { WEALTH_TYPE_LABELS } from "@/domain/wealth-type";
import { DemoFortuneBadge } from "@/components/fortune/demo-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

export function WealthTypeCard({ wealthType }: { wealthType: WealthTypeResult }) {
  const [showMethod, setShowMethod] = useState(false);

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle>재물 유형</CardTitle>
          <CardDesc>설문·성향 기반 참고 분류</CardDesc>
        </div>
        <DemoFortuneBadge />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-[12px] bg-muted p-3">
          <p className="text-xs text-ink/50">1순위</p>
          <p className="mt-1 truncate font-display text-2xl font-semibold text-primary">
            {wealthType.label}
          </p>
          <p className="mt-1 text-sm tabular-nums text-ink/60">{wealthType.score}점</p>
        </div>
        <div className="min-w-0 rounded-[12px] bg-muted p-3">
          <p className="text-xs text-ink/50">2순위</p>
          <p className="mt-1 truncate font-display text-xl font-semibold text-ink">
            {wealthType.secondLabel}
          </p>
          <p className="mt-1 text-sm tabular-nums text-ink/60">{wealthType.secondScore}점</p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm leading-6 text-ink/70">
        {wealthType.reasons.slice(0, 3).map((r) => (
          <li key={r}>· {r}</li>
        ))}
      </ul>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-positive">강점</p>
          <ul className="mt-1 space-y-1 text-sm text-ink/70">
            {wealthType.strengths.slice(0, 2).map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-caution">주의점</p>
          <ul className="mt-1 space-y-1 text-sm text-ink/70">
            {wealthType.cautions.slice(0, 2).map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs text-ink/50">유형별 점수</p>
        <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          {(Object.keys(WEALTH_TYPE_LABELS) as (keyof typeof WEALTH_TYPE_LABELS)[]).map(
            (key) => (
              <li
                key={key}
                className="rounded-md border border-border px-2 py-1.5 tabular-nums"
              >
                <span className="block text-ink/50">{WEALTH_TYPE_LABELS[key]}</span>
                {wealthType.scores[key]}
              </li>
            ),
          )}
        </ul>
      </div>

      {wealthType.keywords.length > 0 ? (
        <p className="mt-3 text-xs text-ink/50">
          설명 키워드(점수 미반영): {wealthType.keywords.slice(0, 4).join(" · ")}
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="mt-4"
        onClick={() => setShowMethod((v) => !v)}
      >
        {showMethod ? "계산 방식 닫기" : "계산 방식 보기"}
      </Button>
      {showMethod ? (
        <p className="mt-2 text-sm leading-6 text-ink/65">{wealthType.method}</p>
      ) : null}
    </Card>
  );
}

export function FortuneSummaryCard({ fortune }: { fortune: FortuneResult | null }) {
  if (!fortune) {
    return (
      <Card>
        <CardTitle>올해 재물운</CardTitle>
        <CardDesc>아직 생성된 운세가 없습니다. 운세 캘린더에서 생성하세요.</CardDesc>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>{fortune.year}년 재물운 요약</CardTitle>
          <CardDesc>
            provider: {fortune.provider} · 세운「{fortune.yearlyTheme}」 · 지수{" "}
            {fortune.yearlyScore}
          </CardDesc>
        </div>
        <DemoFortuneBadge />
      </div>
      <p className="mt-3 text-sm leading-6 text-ink/75">{fortune.yearlySummary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {fortune.keywords.map((k) => (
          <span key={k} className="rounded-md bg-primary/10 px-2.5 py-1 text-xs text-primary">
            {k}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        {fortune.pillars.map((p) => (
          <div key={p.label} className="rounded-lg bg-[#F6F7F9] px-3 py-2">
            <p className="text-xs text-ink/50">{p.label}</p>
            <p className="font-medium">
              {p.heavenly}
              {p.earthly}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-ink/55">{fortune.disclaimer}</p>
    </Card>
  );
}

export function ThisMonthCard({ fortune }: { fortune: FortuneResult | null }) {
  if (!fortune) return null;
  const month = new Date().getMonth() + 1;
  const current = fortune.monthly.find((m) => m.month === month) ?? fortune.monthly[0];

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>{current.month}월 금전운</CardTitle>
          <CardDesc>톤 · 테마 · 참고 점수</CardDesc>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
          {current.tone}
        </span>
      </div>
      <p className="mt-4 font-display text-2xl font-semibold">{current.theme}</p>
      <p className="mt-1 text-sm tabular-nums text-ink/55">참고 점수 {current.score}</p>
      <ul className="mt-3 space-y-1 text-sm leading-6 text-ink/70">
        {current.reasons.map((r) => (
          <li key={r}>· {r}</li>
        ))}
      </ul>
    </Card>
  );
}
