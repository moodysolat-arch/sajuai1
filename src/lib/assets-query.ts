import { prisma } from "@/lib/prisma";
import { toKrw } from "@/lib/money";
import type { AssetType } from "@/domain/enums";

const assetInclude = {
  realEstate: true,
  stock: true,
  cash: true,
  business: true,
} as const;

export async function listAssetsForProfile(profileId: string, type?: AssetType) {
  return prisma.asset.findMany({
    where: {
      profileId,
      ...(type ? { type } : {}),
    },
    include: assetInclude,
    orderBy: { updatedAt: "desc" },
  });
}

/** @deprecated listAssetsForProfile 사용 */
export async function listAssets(type?: AssetType) {
  const profile = await prisma.userProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!profile) return [];
  return listAssetsForProfile(profile.id, type);
}

export function assetKrwValue(asset: {
  currentValue: number;
  fxRateToKrw: number;
}) {
  return toKrw(asset.currentValue, asset.fxRateToKrw);
}

export function assetKrwDebt(asset: { debtValue: number; fxRateToKrw: number }) {
  return toKrw(asset.debtValue, asset.fxRateToKrw);
}

export async function getAssetByIdForProfile(profileId: string, id: string) {
  return prisma.asset.findFirst({
    where: { id, profileId },
    include: {
      ...assetInclude,
      snapshots: { orderBy: { capturedAt: "desc" }, take: 8 },
    },
  });
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      ...assetInclude,
      snapshots: { orderBy: { capturedAt: "desc" }, take: 8 },
    },
  });
}
