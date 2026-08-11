import { AssetsWorkbench } from "@/components/assets/assets-workbench";
import { serializeAsset } from "@/components/assets/serialize-asset";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";

export const dynamic = "force-dynamic";

export default async function CashAssetsPage() {
  const profile = await getCurrentProfile();
  const assets = await listAssetsForProfile(profile.id, "CASH");

  return (
    <AssetsWorkbench
      assets={assets.map(serializeAsset)}
      view="CASH"
      title="현금"
      description="계좌 유형·잔액·비상자금 여부를 관리합니다."
    />
  );
}
