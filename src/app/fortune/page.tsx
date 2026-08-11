import { FortuneCalendar } from "@/components/fortune/fortune-calendar";
import { FortuneYearControls } from "@/components/fortune/year-controls";
import { DemoFortuneBadge } from "@/components/fortune/demo-badge";
import { DisclaimerNotice } from "@/components/ui/disclaimer";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { buildFortuneHomePayload } from "@/lib/summary";
import { toFortuneCalendarView } from "@/services/fortune/mapper";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ year?: string }>;
};

export default async function FortunePage({ searchParams }: Props) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const requested = Number(params.year);
  const year =
    Number.isFinite(requested) && requested >= 2000 && requested <= 2100
      ? requested
      : currentYear;

  const data = await buildFortuneHomePayload(year);
  const years = [year - 1, year, year + 1, currentYear - 1, currentYear, currentYear + 1]
    .filter((y, i, arr) => y >= 2000 && y <= 2100 && arr.indexOf(y) === i)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <PageHeader
        title="운세 캘린더"
        description="데모 해시 기반 참고 해석입니다. 실제 만세력 계산이 아니며 투자 권유가 아닙니다."
        actions={
          <div className="flex flex-col items-end gap-2">
            <DemoFortuneBadge />
            <FortuneYearControls year={year} years={years} />
          </div>
        }
      />

      <DisclaimerNotice compact />

      {!data.fortune || data.fortune.year !== year ? (
        <EmptyState
          title={`${year}년 운세가 없습니다`}
          description="다시 생성으로 참고용 데모 해석을 만드세요."
          action={<FortuneYearControls year={year} years={years} />}
        />
      ) : (
        <FortuneCalendar view={toFortuneCalendarView(data.fortune)} />
      )}
    </div>
  );
}
