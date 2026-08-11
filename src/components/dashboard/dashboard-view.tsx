"use client";

import Link from "next/link";
import { WealthTypeCard } from "@/components/fortune/fortune-cards";
import type { DashboardPayload } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export function DashboardView({ data }: { data: DashboardPayload }) {
  const { prep, profile, wealthType, priorityActions } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="종합 재물운"
        description={`${profile.name}님의 재물운·성향·실행 과제 요약입니다.`}
        actions={
          <Button asChild>
            <Link href="/fortune">운세 캘린더</Link>
          </Button>
        }
      />

      <section aria-label="유형·운세·과제" className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-1">
          <WealthTypeCard wealthType={wealthType} />
          <Link
            href="/wealth-type"
            className="mt-3 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            재물 유형 자세히
          </Link>
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardTitle>올해 재물운</CardTitle>
          <CardDesc>참고용 데모 해석</CardDesc>
          {prep.fortuneYearScore != null ? (
            <>
              <p className="mt-4 font-display text-2xl font-semibold tabular-nums">
                지수 {prep.fortuneYearScore}
              </p>
              <p
                className="mt-1 truncate text-sm text-ink/65"
                title={prep.fortuneMonthTheme ?? undefined}
              >
                {prep.fortuneMonthTheme
                  ? `이번 달 · ${prep.fortuneMonthTheme}`
                  : "월운 데이터 대기"}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink/60">운세를 생성하면 요약이 표시됩니다.</p>
          )}
          <Link
            href="/fortune"
            className="mt-4 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            운세 캘린더
          </Link>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardTitle>우선 실행 과제</CardTitle>
          <CardDesc>상위 3개 · 매매 지시 없음</CardDesc>
          {priorityActions.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">열린 과제가 없습니다.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {priorityActions.map((action) => (
                <li key={action.id} className="rounded-[12px] bg-muted p-3">
                  <p className="truncate font-medium" title={action.title}>
                    {action.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink/65">{action.reason}</p>
                  <p className="mt-1 text-xs text-ink/45">
                    {action.category}
                    {action.dueDate ? ` · ~${action.dueDate}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/actions"
            className="mt-4 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            실행 과제 전체
          </Link>
        </Card>
      </section>
    </div>
  );
}
