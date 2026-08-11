import { MonthlyFortuneChart } from "@/components/charts/monthly-fortune-chart";
import { DemoFortuneBadge } from "@/components/fortune/demo-badge";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import type { FortuneCalendarViewModel } from "@/services/fortune/mapper";

export function FortuneCalendar({ view }: { view: FortuneCalendarViewModel }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle>{view.year}년 세운</CardTitle>
            <CardDesc>
              테마 「{view.yearlyTheme}」 · 참고 지수{" "}
              <span className="tabular-nums">{view.yearlyScore}</span>
              {" · "}
              provider: {view.provider}
            </CardDesc>
          </div>
          <DemoFortuneBadge />
        </div>
        <p className="mt-3 text-sm leading-6 text-ink/75">{view.yearlySummary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {view.keywords.map((k) => (
            <span
              key={k}
              className="rounded-md bg-primary/10 px-2.5 py-1 text-xs text-primary"
            >
              {k}
            </span>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>사주 기둥</CardTitle>
            <CardDesc>
              연·월·일·시주 · 일간 {view.dayMaster}
              {view.hourUnknown ? " · 시주 미상" : ""}
            </CardDesc>
          </div>
          <DemoFortuneBadge />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          {view.pillars.map((p) => (
            <div key={p.label} className="rounded-lg bg-muted px-3 py-3">
              <p className="text-xs text-ink/50">{p.label}</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {p.heavenly}
                {p.earthly === "미상" && p.heavenly === "미상" ? "" : p.earthly}
              </p>
              {p.heavenly === "미상" ? (
                <p className="mt-1 text-xs text-ink/55">출생 시각 없음</p>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>일간과 오행 분포</CardTitle>
            <CardDesc>
              일간 {view.dayMaster} · 비중 합계 {view.elementTotal}% (데모 해시)
            </CardDesc>
          </div>
          <DemoFortuneBadge />
        </div>
        <ul className="mt-4 space-y-3" aria-label="오행 비중">
          {view.elementBars.map((bar) => (
            <li key={bar.element} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                <span>{bar.element}</span>
                <span className="tabular-nums text-ink/60">{bar.weight}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, bar.weight))}%`,
                    background: bar.color,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>대운 10년 구간</CardTitle>
            <CardDesc>겹치지 않는 연령대 테마 · 실제 대운 아님</CardDesc>
          </div>
          <DemoFortuneBadge />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {view.decadeCycles.map((cycle) => (
            <div
              key={`${cycle.startAge}-${cycle.endAge}`}
              className="rounded-[12px] bg-muted p-4"
            >
              <p className="text-sm tabular-nums text-ink/55">
                {cycle.startAge}–{cycle.endAge}세
              </p>
              <p className="mt-1 font-medium">{cycle.theme}</p>
              <p className="mt-2 text-sm text-ink/65">{cycle.keywords.join(" · ")}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>강점</CardTitle>
            <DemoFortuneBadge />
          </div>
          <ul className="mt-3 space-y-1 text-sm text-ink/70">
            {view.strengths.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>주의</CardTitle>
            <DemoFortuneBadge />
          </div>
          <ul className="mt-3 space-y-1 text-sm text-ink/70">
            {view.cautions.map((s) => (
              <li key={s}>· {s}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>12개월 금전운</CardTitle>
            <CardDesc>라인 차트 · 탐색·준비·점검·회수</CardDesc>
          </div>
          <DemoFortuneBadge />
        </div>
        <div className="mt-4">
          <MonthlyFortuneChart monthly={view.monthly} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {view.monthly.map((m) => (
            <div key={m.month} className="rounded-[12px] border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{m.month}월</p>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {m.tone}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink/70">{m.theme}</p>
              <p className="mt-1 text-xs tabular-nums text-ink/50">참고 점수 {m.score}</p>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs leading-5 text-ink/45">{view.disclaimer}</p>
    </div>
  );
}
