import { DashboardView } from "@/components/dashboard/dashboard-view";
import { ErrorState } from "@/components/ui/error-state";
import { loadDashboardPayload } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data;
  try {
    data = await loadDashboardPayload();
  } catch (error) {
    const missing =
      error instanceof Error && error.message === "DEFAULT_PROFILE_MISSING";
    return (
      <ErrorState
        title={missing ? "프로필이 없습니다" : "대시보드를 불러오지 못했습니다"}
        description={
          missing
            ? "데모 시드를 실행한 뒤 다시 시도해 주세요."
            : "잠시 후 새로고침해 주세요."
        }
      />
    );
  }

  return <DashboardView data={data} />;
}
