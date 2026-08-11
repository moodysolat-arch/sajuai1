import { ActionCard, type ActionView } from "@/components/actions/action-card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { computeFinanceSummary } from "@/domain/metrics";
import { parseFortuneSnapshot } from "@/lib/fortune-parse";
import { toWon } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";
import { syncRecommendationsForProfile } from "@/lib/sync-recommendations";

export const dynamic = "force-dynamic";

function todaySeoul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function monthPrefixSeoul() {
  return todaySeoul().slice(0, 7);
}

function toView(action: {
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
}): ActionView {
  return {
    id: action.id,
    title: action.title,
    category: action.category,
    reason: action.reason,
    completionCriteria: action.completionCriteria,
    dueDate: action.dueDate,
    status: action.status,
    source: action.source,
    memo: action.memo,
    dedupeKey: action.dedupeKey,
  };
}

export default async function ActionsPage() {
  const profile = await getCurrentProfile();
  const year = new Date().getFullYear();
  const assets = await listAssetsForProfile(profile.id);
  const summary = computeFinanceSummary(assets, toWon(profile.monthlyExpense));
  const fortuneRow = await prisma.fortuneSnapshot.findFirst({
    where: { profileId: profile.id, year },
    orderBy: { generatedAt: "desc" },
  });
  const fortune = fortuneRow ? parseFortuneSnapshot(fortuneRow) : null;

  await syncRecommendationsForProfile({
    profileId: profile.id,
    goal: profile.goal,
    riskLevel: profile.riskLevel,
    birthTime: profile.birthTime,
    summary,
    fortune,
  });

  const actions = await prisma.actionTask.findMany({
    where: { profileId: profile.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { updatedAt: "desc" }],
  });

  const today = todaySeoul();
  const month = monthPrefixSeoul();

  const todayItems = actions.filter(
    (a) => a.status !== "DONE" && a.dueDate === today,
  );
  const monthItems = actions.filter(
    (a) =>
      a.status !== "DONE" &&
      a.dueDate &&
      a.dueDate.startsWith(month) &&
      a.dueDate !== today,
  );
  const openNoDue = actions.filter((a) => a.status !== "DONE" && !a.dueDate);
  const doneItems = actions.filter((a) => a.status === "DONE");

  return (
    <div className="space-y-8">
      <PageHeader
        title="실행 과제"
        description="재무 안전 규칙·목표·월운 태그를 반영한 참고 과제입니다. 종목·상품·지역 매매를 지시하지 않습니다."
      />

      {actions.length === 0 ? (
        <EmptyState
          title="과제가 없습니다"
          description="자산을 등록하거나 운세를 생성하면 추천 과제가 채워집니다."
        />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">오늘</h2>
            {todayItems.length === 0 ? (
              <p className="text-sm text-ink/55">오늘 기한 과제가 없습니다.</p>
            ) : (
              todayItems.map((a) => <ActionCard key={a.id} action={toView(a)} />)
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">이번 달</h2>
            {[...monthItems, ...openNoDue].length === 0 ? (
              <p className="text-sm text-ink/55">이번 달 진행 과제가 없습니다.</p>
            ) : (
              [...monthItems, ...openNoDue].map((a) => (
                <ActionCard key={a.id} action={toView(a)} />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">완료</h2>
            {doneItems.length === 0 ? (
              <p className="text-sm text-ink/55">완료한 과제가 없습니다.</p>
            ) : (
              doneItems.map((a) => <ActionCard key={a.id} action={toView(a)} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}
