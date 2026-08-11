"use client";

import Link from "next/link";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { KpiDelta } from "@/components/dashboard/kpi-delta";
import { WealthTypeCard } from "@/components/fortune/fortune-cards";
import type { DashboardPayload } from "@/lib/dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatPercent } from "@/lib/money";

function HealthBar({ label, score }: { label: string; score: number }) {
  const width = Math.max(0, Math.min(100, score));
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-ink/65">{label}</span>
        <span className="shrink-0 tabular-nums font-medium text-ink">{score}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardView({ data }: { data: DashboardPayload }) {
  const {
    summary,
    holdings,
    mom,
    assetCount,
    prep,
    valueByType,
    profile,
    wealthType,
    priorityActions,
  } = data;
  const empty = assetCount === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`${profile.name}님의 자산 요약입니다. 숫자는 DB와 실시간 계산 결과입니다.`}
        actions={
          <Button asChild>
            <Link href="/assets">자산 관리</Link>
          </Button>
        }
      />

      {empty ? (
        <EmptyState
          title="등록된 자산이 없습니다"
          description="자산을 등록하면 총자산·구성비·재무 건강 점수가 계산됩니다."
          action={
            <Button asChild>
              <Link href="/assets">자산 등록</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* 1행 KPI */}
          <section aria-label="핵심 지표" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="총자산"
              footer={<KpiDelta mom={mom.totalAssets} />}
            >
              <span className="block truncate">
                <CurrencyDisplay value={summary.totalAssets} compact />
              </span>
            </MetricCard>
            <MetricCard
              label="총부채"
              footer={<KpiDelta mom={mom.totalDebt} />}
            >
              <span className="block truncate">
                <CurrencyDisplay value={summary.totalDebt} compact />
              </span>
            </MetricCard>
            <MetricCard
              label="순자산"
              footer={<KpiDelta mom={mom.netWorth} />}
            >
              <span className="block truncate">
                <CurrencyDisplay value={summary.netWorth} compact />
              </span>
            </MetricCard>
            <MetricCard label="이번 달 순현금흐름" hint="자산 월수입 − 월지출">
              <span className="block truncate">
                <CurrencyDisplay value={summary.monthlyCashflow} compact />
              </span>
            </MetricCard>
          </section>

          {/* 2행: 모바일에서는 목록 먼저 */}
          <section
            aria-label="자산 구성"
            className="grid gap-4 lg:grid-cols-2"
          >
            <Card className="min-w-0 overflow-hidden order-2 lg:order-1">
              <CardTitle>자산 구성</CardTitle>
              <CardDesc>유형별 평가액 비중</CardDesc>
              <div className="mt-4">
                <AllocationChart
                  allocation={summary.allocation}
                  valueByType={valueByType}
                />
              </div>
            </Card>

            <Card className="min-w-0 overflow-hidden order-1 lg:order-2">
              <CardTitle>내 재물은 어디에 있나</CardTitle>
              <CardDesc>기관·계좌·주소별 평가액과 비중</CardDesc>
              {holdings.length === 0 ? (
                <div className="mt-4">
                  <EmptyState title="표시할 자산이 없습니다" />
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-border" aria-label="자산 위치 목록">
                  {holdings.map((h) => (
                    <li key={h.id} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink" title={h.label}>
                          {h.label}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink/55" title={h.detail}>
                          {h.typeLabel} · {h.detail}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular-nums text-sm font-medium">
                          <CurrencyDisplay value={h.valueKrw} compact />
                        </p>
                        <p className="mt-0.5 text-xs tabular-nums text-ink/50">
                          {formatPercent(h.sharePct)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          {/* 3행 재무 건강 */}
          <section aria-label="재무 건강">
            <Card className="min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <CardTitle>재무 건강</CardTitle>
                  <CardDesc>유동성 30 · 부채 30 · 집중도 20 · 현금흐름 20</CardDesc>
                </div>
                <p className="font-display text-3xl font-semibold tabular-nums text-primary">
                  {summary.healthScore}
                  <span className="text-base font-normal text-ink/45"> / 100</span>
                </p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <HealthBar label="유동성" score={summary.healthBreakdown.liquidity} />
                <HealthBar label="부채" score={summary.healthBreakdown.debt} />
                <HealthBar label="집중도" score={summary.healthBreakdown.concentration} />
                <HealthBar label="현금흐름" score={summary.healthBreakdown.cashflow} />
              </div>
              <dl className="mt-4 grid gap-2 text-xs text-ink/55 sm:grid-cols-2">
                <div>
                  최대 집중도{" "}
                  <span className="tabular-nums text-ink/80">
                    {formatPercent(summary.concentration)}
                  </span>
                </div>
                <div>
                  비상자금{" "}
                  <span className="tabular-nums text-ink/80">
                    {summary.emergencyMonths == null
                      ? "—"
                      : `${summary.emergencyMonths.toFixed(1)}개월`}
                  </span>
                </div>
              </dl>
            </Card>
          </section>
        </>
      )}

      {/* 4행: 재물 유형 · 재물운 · 우선 과제 3개 */}
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
          <CardDesc>참고용 데모 해석 · 자산 점수와 합산하지 않음</CardDesc>
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
