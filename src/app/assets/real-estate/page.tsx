import { AssetsWorkbench } from "@/components/assets/assets-workbench";
import { serializeAsset } from "@/components/assets/serialize-asset";
import { getCurrentProfile } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";

export const dynamic = "force-dynamic";

export default async function RealEstateAssetsPage() {
  const profile = await getCurrentProfile();
  const assets = await listAssetsForProfile(profile.id, "REAL_ESTATE");

  return (
    <AssetsWorkbench
      assets={assets.map(serializeAsset)}
      view="REAL_ESTATE"
      title="부동산"
      description="시가·대출·담보비율·월 임대/비용을 관리합니다."
    />
  );
}
