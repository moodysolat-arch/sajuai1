import { AssetsSummaryStrip } from "@/components/assets/assets-summary-strip";
import { AssetsWorkbench } from "@/components/assets/assets-workbench";
import { serializeAsset } from "@/components/assets/serialize-asset";
import { computeFinanceSummary } from "@/domain/metrics";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";
import { toWon } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const profile = await getCurrentProfile();
  const assets = await listAssetsForProfile(profile.id);
  const summary = computeFinanceSummary(assets, toWon(profile.monthlyExpense));
  const items = assets.map(serializeAsset);

  return (
    <div className="space-y-6">
      <AssetsSummaryStrip summary={summary} />
      <AssetsWorkbench
        assets={items}
        view="all"
        title="총 자산"
        description="자산을 추가·수정·삭제하고 검색·정렬·유형 필터로 관리합니다."
      />
    </div>
  );
}
