"use client";

import { useId, useState } from "react";
import { useMask } from "@/components/layout/mask-context";
import { ASSET_TYPE_LABELS, type AssetType } from "@/domain/enums";
import { formatKrw, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

const COLORS: Record<string, string> = {
  REAL_ESTATE: "#315C57",
  STOCK: "#C8923D",
  CASH: "#2E7D5B",
  BUSINESS: "#4C6EF5",
  OTHER: "#8B93A7",
};

type ChartRow = {
  key: string;
  name: string;
  pct: number;
  valueKrw: number;
  color: string;
};

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlicePath(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  start: number,
  end: number,
) {
  const large = end - start > 180 ? 1 : 0;
  const o1 = polar(cx, cy, outer, start);
  const o2 = polar(cx, cy, outer, end);
  const i1 = polar(cx, cy, inner, end);
  const i2 = polar(cx, cy, inner, start);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

export function AllocationChart({
  allocation,
  valueByType,
  className,
  showLegend = true,
}: {
  allocation: Record<string, number>;
  valueByType?: Record<string, number>;
  className?: string;
  showLegend?: boolean;
}) {
  const { masked } = useMask();
  const gradId = useId();
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const data: ChartRow[] = Object.entries(allocation)
    .filter(([, pct]) => pct > 0)
    .map(([key, pct]) => ({
      key,
      name: ASSET_TYPE_LABELS[key as AssetType] ?? key,
      pct: Number(pct.toFixed(1)),
      valueKrw: valueByType?.[key] ?? 0,
      color: COLORS[key] ?? "#8B93A7",
    }))
    .sort((a, b) => b.pct - a.pct);

  if (!data.length) {
    return <p className="text-sm text-ink/55">표시할 자산 배분이 없습니다.</p>;
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const outer = 84;
  const inner = 52;
  const totalPct = data.reduce((s, d) => s + d.pct, 0) || 1;

  const slices = data.reduce<Array<ChartRow & { start: number; end: number }>>(
    (acc, d) => {
      const start = acc.length ? acc[acc.length - 1].end : 0;
      const end = start + (d.pct / totalPct) * 360;
      acc.push({ ...d, start, end });
      return acc;
    },
    [],
  );

  const active = slices.find((s) => s.key === hoverKey) ?? null;

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="relative mx-auto flex h-52 w-full max-w-[280px] items-center justify-center overflow-hidden sm:h-56 sm:max-w-none">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="자산 구성 도넛 차트"
          className="max-h-full max-w-full"
        >
          <title>자산 구성</title>
          <defs>
            <filter id={`${gradId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.12" />
            </filter>
          </defs>
          {slices.map((s) => (
            <path
              key={s.key}
              d={donutSlicePath(cx, cy, inner, outer, s.start, s.end - 0.4)}
              fill={s.color}
              opacity={hoverKey && hoverKey !== s.key ? 0.45 : 1}
              filter={`url(#${gradId}-shadow)`}
              onMouseEnter={() => setHoverKey(s.key)}
              onMouseLeave={() => setHoverKey(null)}
              onFocus={() => setHoverKey(s.key)}
              onBlur={() => setHoverKey(null)}
              tabIndex={0}
              className="outline-none transition-opacity"
            >
              <title>{`${s.name}: ${masked ? "••••••" : formatKrw(s.valueKrw)} (${formatPercent(s.pct)})`}</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={inner - 2} fill="var(--card, #fff)" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-ink text-[11px]"
            style={{ fontSize: 11 }}
          >
            {active ? active.name : "구성"}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            className="fill-ink font-semibold"
            style={{ fontSize: 14 }}
          >
            {active
              ? masked
                ? "••••••"
                : formatPercent(active.pct)
              : formatPercent(Math.min(100, totalPct))}
          </text>
        </svg>

        {active ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute bottom-2 left-1/2 z-10 w-[min(100%,14rem)] -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-center text-xs shadow-sm"
          >
            <p className="truncate font-medium text-ink">{active.name}</p>
            <p className="mt-1 tabular-nums text-ink/70">
              {masked ? "••••••" : formatKrw(active.valueKrw)} · {formatPercent(active.pct)}
            </p>
          </div>
        ) : null}
      </div>

      {showLegend ? (
        <ul
          className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"
          aria-label="구성 범례"
        >
          {data.map((d) => (
            <li
              key={d.key}
              className="flex min-w-0 items-center gap-2 text-ink/75"
              onMouseEnter={() => setHoverKey(d.key)}
              onMouseLeave={() => setHoverKey(null)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="truncate">{d.name}</span>
              <span className="ml-auto shrink-0 tabular-nums">{formatPercent(d.pct)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { COLORS as ALLOCATION_COLORS };
