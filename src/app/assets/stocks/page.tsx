import { AssetsWorkbench } from "@/components/assets/assets-workbench";
import { serializeAsset } from "@/components/assets/serialize-asset";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";

export const dynamic = "force-dynamic";

export default async function StockAssetsPage() {
  const profile = await getCurrentProfile();
  const assets = await listAssetsForProfile(profile.id, "STOCK");

  return (
    <AssetsWorkbench
      assets={assets.map(serializeAsset)}
      view="STOCK"
      title="주식"
      description="수량·평균단가·현재가·평가손익을 관리합니다."
    />
  );
}
