import { ASSET_TYPE_LABELS, type AssetType } from "@/domain/enums";
import { toKrw, toWon } from "@/lib/money";

export type MomDelta = {
  previous: number;
  delta: number;
  /** previous가 0이면 null (0으로 나누기 방지) */
  deltaPct: number | null;
};

export type SnapshotLike = {
  assetId: string;
  value: number | string | { toString(): string };
  debt: number | string | { toString(): string };
  capturedAt: Date | string;
  fxRateToKrw?: number | string | { toString(): string } | null;
};

export type HoldingPlace = {
  id: string;
  label: string;
  detail: string;
  type: AssetType;
  typeLabel: string;
  valueKrw: number;
  sharePct: number;
};

export type HoldingAssetLike = {
  id: string;
  type: string;
  name: string;
  institutionOrLocation?: string | null;
  currentValue: number | string | { toString(): string };
  fxRateToKrw?: number | string | { toString(): string } | null;
  realEstate?: { address?: string | null } | null;
  cash?: { accountType?: string | null } | null;
  stock?: { ticker?: string | null } | null;
};

/** Asia/Seoul 기준 YYYY-MM */
export function monthKeySeoul(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(d);
}

export function aggregateSnapshotsByMonth(snapshots: SnapshotLike[]): {
  month: string;
  totalAssets: number;
  totalDebt: number;
  netWorth: number;
}[] {
  const buckets = new Map<string, { totalAssets: number; totalDebt: number }>();

  for (const s of snapshots) {
    const key = monthKeySeoul(s.capturedAt);
    const fx = s.fxRateToKrw ?? 1;
    const prev = buckets.get(key) ?? { totalAssets: 0, totalDebt: 0 };
    prev.totalAssets += toKrw(s.value, fx);
    prev.totalDebt += toKrw(s.debt, fx);
    buckets.set(key, prev);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month,
      totalAssets: v.totalAssets,
      totalDebt: v.totalDebt,
      netWorth: v.totalAssets - v.totalDebt,
    }));
}

function toMom(current: number, previous: number): MomDelta {
  const delta = current - previous;
  const deltaPct = previous === 0 ? null : (delta / previous) * 100;
  return { previous, delta, deltaPct };
}

/**
 * 전월 대비 KPI.
 * 서로 다른 스냅샷 월이 2개 이상일 때만 값을 반환하고, 아니면 null.
 * 현재값은 라이브 summary, 비교 대상은 최신 직전 월 스냅샷 합계.
 */
export function calcKpiMonthOverMonth(
  current: { totalAssets: number; totalDebt: number; netWorth: number },
  snapshots: SnapshotLike[],
): {
  totalAssets: MomDelta | null;
  totalDebt: MomDelta | null;
  netWorth: MomDelta | null;
  monthCount: number;
  previousMonth: string | null;
} {
  const months = aggregateSnapshotsByMonth(snapshots);
  if (months.length < 2) {
    return {
      totalAssets: null,
      totalDebt: null,
      netWorth: null,
      monthCount: months.length,
      previousMonth: null,
    };
  }

  const previous = months[months.length - 2];
  return {
    totalAssets: toMom(current.totalAssets, previous.totalAssets),
    totalDebt: toMom(current.totalDebt, previous.totalDebt),
    netWorth: toMom(current.netWorth, previous.netWorth),
    monthCount: months.length,
    previousMonth: previous.month,
  };
}

function placeLabel(asset: HoldingAssetLike): { label: string; detail: string } {
  const type = (asset.type in ASSET_TYPE_LABELS ? asset.type : "OTHER") as AssetType;
  const institution = asset.institutionOrLocation?.trim() || "";
  const address = asset.realEstate?.address?.trim() || "";
  const ticker = asset.stock?.ticker?.trim() || "";
  const accountType = asset.cash?.accountType?.trim() || "";

  if (type === "REAL_ESTATE") {
    return {
      label: asset.name,
      detail: address || institution || "주소 미등록",
    };
  }
  if (type === "CASH") {
    return {
      label: asset.name,
      detail: [institution, accountType].filter(Boolean).join(" · ") || "계좌 정보 없음",
    };
  }
  if (type === "STOCK") {
    return {
      label: asset.name,
      detail: [institution, ticker].filter(Boolean).join(" · ") || "기관 미등록",
    };
  }
  return {
    label: asset.name,
    detail: institution || "기관·위치 미등록",
  };
}

/** 기관·계좌·주소별 평가액과 비중 (총자산 0이면 비중 0) */
export function calcHoldingsByPlace(
  assets: HoldingAssetLike[],
  totalAssets: number,
): HoldingPlace[] {
  const rows = assets.map((asset) => {
    const type = (asset.type in ASSET_TYPE_LABELS ? asset.type : "OTHER") as AssetType;
    const valueKrw = toKrw(asset.currentValue, asset.fxRateToKrw ?? 1);
    const { label, detail } = placeLabel(asset);
    const sharePct = totalAssets > 0 ? (valueKrw / totalAssets) * 100 : 0;
    return {
      id: asset.id,
      label,
      detail,
      type,
      typeLabel: ASSET_TYPE_LABELS[type],
      valueKrw: toWon(valueKrw),
      sharePct,
    };
  });

  return rows.sort((a, b) => b.valueKrw - a.valueKrw);
}
