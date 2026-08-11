import Link from "next/link";
import { WealthTypeCard } from "@/components/fortune/fortune-cards";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { buildFortuneHomePayload } from "@/lib/summary";

export const dynamic = "force-dynamic";

export default async function WealthTypePage() {
  const data = await buildFortuneHomePayload();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-[28px] font-semibold">재물 유형</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          설문 50% · 자산 구성 30% · 현금흐름 20%로 분류합니다. 사주 정보는 설명 키워드에만
          쓰이며 점수에 넣지 않습니다.
        </p>
      </section>

      <WealthTypeCard wealthType={data.wealthType} />

      <Card>
        <CardTitle>점수 구성</CardTitle>
        <CardDesc>유형별 합산 점수</CardDesc>
        <ul className="mt-4 space-y-2 text-sm">
          {Object.entries(data.wealthType.scores).map(([key, score]) => (
            <li key={key} className="flex justify-between gap-3 border-b border-border/70 py-2">
              <span>{key}</span>
              <span className="tabular-nums">{score}</span>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-sm text-ink/55">
        <Link href="/dashboard" className="text-primary hover:underline">
          대시보드
        </Link>
        {" · "}
        <Link href="/fortune" className="text-primary hover:underline">
          운세 캘린더
        </Link>
      </p>
    </div>
  );
}
