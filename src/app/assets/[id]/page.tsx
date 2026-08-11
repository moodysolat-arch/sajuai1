import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetDetailClient } from "@/components/assets/asset-detail-client";
import { serializeAsset } from "@/components/assets/serialize-asset";
import { getCurrentProfile } from "@/lib/auth";
import { getAssetByIdForProfile } from "@/lib/assets-query";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function AssetDetailPage({ params }: Params) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const asset = await getAssetByIdForProfile(profile.id, id);
  if (!asset) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/assets" className="text-sm text-primary hover:underline">
          ← 총 자산
        </Link>
        <h1 className="mt-2 font-display text-[28px] font-semibold leading-[34px]">
          {asset.name}
        </h1>
        <p className="mt-1 text-sm text-ink/60">자산 상세 · 수정</p>
      </div>
      <AssetDetailClient asset={serializeAsset(asset)} />
    </div>
  );
}
