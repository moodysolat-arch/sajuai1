import Link from "next/link";
import { MonthlyFortuneChart } from "@/components/charts/monthly-fortune-chart";
import { ActionStatusButtons } from "@/components/actions/action-status-buttons";
import {
  FortuneSummaryCard,
  ThisMonthCard,
  WealthTypeCard,
} from "@/components/fortune/fortune-cards";
import { GenerateFortuneButton } from "@/components/fortune/generate-button";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { buildFortuneHomePayload } from "@/lib/summary";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const year = new Date().getFullYear();
  const data = await buildFortuneHomePayload(year);
  const todoActions = data.actions.filter((a) => a.status === "TODO").slice(0, 3);
  const hourUnknown = !data.profile.birthTime;

  return (
    <div className="space-y-6">
      <PageHeader
        title="재물 나침반"
        description={`${data.profile.name}님의 사주 재물운입니다. 참고용 해석이며 투자 권유·수익 보장이 아닙니다.${
          hourUnknown ? " 출생 시각이 없어 시주는 미상으로 표시됩니다." : ""
        }`}
        actions={<GenerateFortuneButton year={year} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <WealthTypeCard wealthType={data.wealthType} />
        <ThisMonthCard fortune={data.fortune} />
      </div>

      <FortuneSummaryCard fortune={data.fortune} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardTitle>참고 실행 과제</CardTitle>
          <CardDesc>학습·점검·기록만 · 매매 지시 없음</CardDesc>
          {todoActions.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="열린 과제가 없습니다" />
            </div>
          ) : (
            <ul className="mt-4 space-y-4">
              {todoActions.map((action) => (
                <li key={action.id} className="rounded-[12px] bg-muted p-3">
                  <p className="font-medium">{action.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink/65">{action.reason}</p>
                  <div className="mt-3">
                    <ActionStatusButtons id={action.id} status={action.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/actions"
            className="mt-4 inline-block text-sm text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            실행 과제 전체 보기
          </Link>
        </Card>

        {data.fortune ? (
          <Card className="xl:col-span-2">
            <CardTitle>12개월 금전운</CardTitle>
            <CardDesc>참고용 해석 · provider: {data.fortune.provider}</CardDesc>
            <div className="mt-4">
              <MonthlyFortuneChart monthly={data.fortune.monthly} />
            </div>
          </Card>
        ) : (
          <Card className="xl:col-span-2">
            <CardTitle>12개월 금전운</CardTitle>
            <CardDesc>운세를 생성하면 그래프가 표시됩니다.</CardDesc>
            <div className="mt-4">
              <EmptyState
                title="운세 데이터 없음"
                description="운세 새로고침을 눌러 주세요."
              />
            </div>
          </Card>
        )}
      </div>

      <p className="text-xs leading-5 text-ink/45">
        <Link
          href="/wealth-type"
          className="text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          재물 성향 자세히
        </Link>
        {" · "}
        <Link
          href="/fortune"
          className="text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          운세 캘린더
        </Link>
      </p>
    </div>
  );
}
