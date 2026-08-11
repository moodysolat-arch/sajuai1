"use client";

import type { MonthlyFortune } from "@/services/fortune/types";

const TONE_COLOR: Record<MonthlyFortune["tone"], string> = {
  탐색: "#4C6EF5",
  준비: "#315C57",
  점검: "#C8923D",
  회수: "#8B93A7",
};

/** 1~12월 금전운 라인 차트 (참고 점수, 자산 점수와 합산하지 않음) */
export function MonthlyFortuneChart({ monthly }: { monthly: MonthlyFortune[] }) {
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 28, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const minY = 40;
  const maxY = 90;
  const points = monthly.map((m, i) => {
    const x = pad.left + (plotW * i) / Math.max(monthly.length - 1, 1);
    const y = pad.top + plotH * (1 - (m.score - minY) / (maxY - minY));
    return { ...m, x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full max-w-full"
        role="img"
        aria-label="월별 금전운 라인 차트"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>월별 금전운 (참고용 데모)</title>
        {[45, 55, 65, 75, 85].map((tick) => {
          const y = pad.top + plotH * (1 - (tick - minY) / (maxY - minY));
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#E5E8EE"
                strokeDasharray="3 3"
              />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#8B93A7" fontSize="11">
                {tick}
              </text>
            </g>
          );
        })}
        <path d={line} fill="none" stroke="#315C57" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p) => (
          <g key={p.month}>
            <circle cx={p.x} cy={p.y} r={5} fill={TONE_COLOR[p.tone]} stroke="#fff" strokeWidth="1.5">
              <title>{`${p.month}월 · ${p.tone} · ${p.score}`}</title>
            </circle>
            <text x={p.x} y={height - 8} textAnchor="middle" fill="#8B93A7" fontSize="11">
              {p.month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
