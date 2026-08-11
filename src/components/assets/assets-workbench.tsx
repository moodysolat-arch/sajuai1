"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AssetForm } from "@/components/assets/asset-form";
import type { AssetListItem } from "@/components/assets/asset-types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PercentageBadge } from "@/components/ui/percentage-badge";
import {
  calcRealEstateMetrics,
  calcStockPnl,
} from "@/domain/metrics";
import { ASSET_TYPE_LABELS, type AssetType } from "@/domain/enums";
import { toKrw } from "@/lib/money";

type SortKey = "updatedAt" | "name" | "currentValue" | "debtValue";
type ViewMode = "all" | "REAL_ESTATE" | "STOCK" | "CASH";

function formatUpdatedAt(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AssetsWorkbench({
  assets,
  view = "all",
  title,
  description,
}: {
  assets: AssetListItem[];
  view?: ViewMode;
  title: string;
  description?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AssetType | "ALL">(
    view === "all" ? "ALL" : view,
  );
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssetListItem | null>(null);
  const [deleting, setDeleting] = useState<AssetListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );

  const defaultType: AssetType =
    view === "all" ? "CASH" : (view as AssetType);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = assets.filter((a) => {
      if (view !== "all" && a.type !== view) return false;
      if (view === "all" && typeFilter !== "ALL" && a.type !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        a.name,
        a.institutionOrLocation ?? "",
        a.stock?.ticker ?? "",
        a.cash?.accountType ?? "",
        ASSET_TYPE_LABELS[a.type],
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name, "ko");
      else if (sortKey === "currentValue") {
        cmp =
          toKrw(a.currentValue, a.fxRateToKrw) - toKrw(b.currentValue, b.fxRateToKrw);
      } else if (sortKey === "debtValue") {
        cmp = toKrw(a.debtValue, a.fxRateToKrw) - toKrw(b.debtValue, b.fxRateToKrw);
      } else {
        cmp =
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [assets, query, typeFilter, sortKey, sortDir, view]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
    setFeedback(null);
  }

  function openEdit(asset: AssetListItem) {
    setEditing(asset);
    setFormOpen(true);
    setFeedback(null);
  }

  async function confirmDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/assets/${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ tone: "err", text: data.message ?? "삭제에 실패했습니다." });
        return;
      }
      setFeedback({ tone: "ok", text: `"${deleting.name}"을(를) 삭제했습니다.` });
      setDeleting(null);
      router.refresh();
    } catch {
      setFeedback({ tone: "err", text: "네트워크 오류가 발생했습니다." });
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-[34px] text-ink">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{description}</p>
          ) : null}
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          자산 추가
        </Button>
      </header>

      {feedback ? (
        <div
          role="status"
          className={
            feedback.tone === "ok"
              ? "rounded-[12px] border border-positive/30 bg-positive/10 px-4 py-3 text-sm text-positive"
              : "rounded-[12px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          }
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="이름·기관·티커 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="자산 검색"
        />
        {view === "all" ? (
          <select
            className="input w-auto"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as AssetType | "ALL")}
            aria-label="유형 필터"
          >
            <option value="ALL">전체 유형</option>
            {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        ) : null}
        <select
          className="input w-auto"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          aria-label="정렬 기준"
        >
          <option value="updatedAt">마지막 갱신</option>
          <option value="name">이름</option>
          <option value="currentValue">평가액</option>
          <option value="debtValue">부채</option>
        </select>
        <select
          className="input w-auto"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
          aria-label="정렬 방향"
        >
          <option value="desc">내림차순</option>
          <option value="asc">오름차순</option>
        </select>
      </div>

      {!filtered.length ? (
        <EmptyState
          title="등록된 자산이 없습니다"
          description="첫 자산을 추가하면 요약·구성비가 계산됩니다."
          action={
            <Button type="button" onClick={openCreate}>
              자산 등록
            </Button>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-[12px] border border-border bg-card md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/60 text-ink/60">
                <tr>
                  {view === "all" ? (
                    <>
                      <th className="px-4 py-3 font-medium">이름</th>
                      <th className="px-4 py-3 font-medium">유형</th>
                      <th className="px-4 py-3 font-medium">평가액</th>
                      <th className="px-4 py-3 font-medium">부채</th>
                      <th className="px-4 py-3 font-medium">마지막 갱신</th>
                    </>
                  ) : null}
                  {view === "REAL_ESTATE" ? (
                    <>
                      <th className="px-4 py-3 font-medium">자산</th>
                      <th className="px-4 py-3 font-medium">시가</th>
                      <th className="px-4 py-3 font-medium">대출잔액</th>
                      <th className="px-4 py-3 font-medium">순자산</th>
                      <th className="px-4 py-3 font-medium">담보비율</th>
                      <th className="px-4 py-3 font-medium">월 임대/비용</th>
                      <th className="px-4 py-3 font-medium">갱신</th>
                    </>
                  ) : null}
                  {view === "STOCK" ? (
                    <>
                      <th className="px-4 py-3 font-medium">종목</th>
                      <th className="px-4 py-3 font-medium">수량</th>
                      <th className="px-4 py-3 font-medium">평균/현재</th>
                      <th className="px-4 py-3 font-medium">평가액</th>
                      <th className="px-4 py-3 font-medium">평가손익</th>
                      <th className="px-4 py-3 font-medium">수익률</th>
                      <th className="px-4 py-3 font-medium">갱신</th>
                    </>
                  ) : null}
                  {view === "CASH" ? (
                    <>
                      <th className="px-4 py-3 font-medium">계좌</th>
                      <th className="px-4 py-3 font-medium">잔액</th>
                      <th className="px-4 py-3 font-medium">금리</th>
                      <th className="px-4 py-3 font-medium">만기</th>
                      <th className="px-4 py-3 font-medium">비상자금</th>
                      <th className="px-4 py-3 font-medium">갱신</th>
                    </>
                  ) : null}
                  <th className="px-4 py-3 font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-border/70 last:border-0">
                    {view === "all" ? (
                      <>
                        <td className="px-4 py-3">
                          <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">
                            {a.name}
                          </Link>
                          {a.institutionOrLocation ? (
                            <p className="text-xs text-ink/50">{a.institutionOrLocation}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{ASSET_TYPE_LABELS[a.type]}</td>
                        <td className="px-4 py-3">
                          <CurrencyDisplay value={toKrw(a.currentValue, a.fxRateToKrw)} />
                        </td>
                        <td className="px-4 py-3">
                          <CurrencyDisplay value={toKrw(a.debtValue, a.fxRateToKrw)} />
                        </td>
                        <td className="px-4 py-3 text-ink/60">{formatUpdatedAt(a.updatedAt)}</td>
                      </>
                    ) : null}
                    {view === "REAL_ESTATE"
                      ? (() => {
                          const loan = a.realEstate?.loanBalance ?? a.debtValue;
                          const { equity, ltv } = calcRealEstateMetrics({
                            marketValue: a.currentValue,
                            loanBalance: loan,
                          });
                          return (
                            <>
                              <td className="px-4 py-3">
                                <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">
                                  {a.name}
                                </Link>
                                <p className="text-xs text-ink/50">
                                  {a.institutionOrLocation ?? a.realEstate?.address}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <CurrencyDisplay value={a.currentValue} />
                              </td>
                              <td className="px-4 py-3">
                                <CurrencyDisplay value={loan} />
                              </td>
                              <td className="px-4 py-3">
                                <CurrencyDisplay value={equity} />
                              </td>
                              <td className="px-4 py-3">{ltv.toFixed(1)}%</td>
                              <td className="px-4 py-3 text-xs">
                                <div>
                                  수입 <CurrencyDisplay value={a.monthlyIncome} />
                                </div>
                                <div>
                                  비용 <CurrencyDisplay value={a.monthlyExpense} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-ink/60">
                                {formatUpdatedAt(a.updatedAt)}
                              </td>
                            </>
                          );
                        })()
                      : null}
                    {view === "STOCK"
                      ? (() => {
                          const s = a.stock;
                          const pnl = s
                            ? calcStockPnl({
                                quantity: s.quantity,
                                averagePrice: s.averagePrice,
                                currentPrice: s.currentPrice,
                              })
                            : null;
                          return (
                            <>
                              <td className="px-4 py-3">
                                <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">
                                  {a.name}
                                </Link>
                                <p className="text-xs text-ink/50">
                                  {s?.ticker} · {a.currency}
                                </p>
                              </td>
                              <td className="px-4 py-3">{s?.quantity ?? "-"}</td>
                              <td className="px-4 py-3 text-xs">
                                <div>{s?.averagePrice.toLocaleString("ko-KR")}</div>
                                <div>{s?.currentPrice.toLocaleString("ko-KR")}</div>
                              </td>
                              <td className="px-4 py-3">
                                <CurrencyDisplay
                                  value={toKrw(a.currentValue, a.fxRateToKrw)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                {pnl ? (
                                  <CurrencyDisplay
                                    value={toKrw(pnl.pnl, a.fxRateToKrw)}
                                  />
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {pnl ? <PercentageBadge value={pnl.returnRate} /> : "-"}
                              </td>
                              <td className="px-4 py-3 text-ink/60">
                                {formatUpdatedAt(a.updatedAt)}
                              </td>
                            </>
                          );
                        })()
                      : null}
                    {view === "CASH" ? (
                      <>
                        <td className="px-4 py-3">
                          <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">
                            {a.name}
                          </Link>
                          <p className="text-xs text-ink/50">
                            {a.institutionOrLocation} · {a.cash?.accountType}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <CurrencyDisplay value={a.currentValue} />
                        </td>
                        <td className="px-4 py-3">
                          {a.cash?.interestRate != null ? `${a.cash.interestRate}%` : "-"}
                        </td>
                        <td className="px-4 py-3">{a.cash?.maturityDate ?? "-"}</td>
                        <td className="px-4 py-3">
                          {a.cash?.isEmergencyFund ? "예" : "아니오"}
                        </td>
                        <td className="px-4 py-3 text-ink/60">
                          {formatUpdatedAt(a.updatedAt)}
                        </td>
                      </>
                    ) : null}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 px-2"
                          onClick={() => openEdit(a)}
                          aria-label={`${a.name} 수정`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 px-2"
                          onClick={() => setDeleting(a)}
                          aria-label={`${a.name} 삭제`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="rounded-[12px] border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/assets/${a.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {a.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink/55">
                      {view === "all" ? ASSET_TYPE_LABELS[a.type] : null}
                      {a.institutionOrLocation
                        ? `${view === "all" ? " · " : ""}${a.institutionOrLocation}`
                        : ""}
                      {a.stock?.ticker ? ` · ${a.stock.ticker}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-2"
                      aria-label={`${a.name} 수정`}
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-2"
                      aria-label={`${a.name} 삭제`}
                      onClick={() => setDeleting(a)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {view === "all" || view === "CASH" ? (
                    <>
                      <div>
                        <dt className="text-xs text-ink/50">평가액/잔액</dt>
                        <dd>
                          <CurrencyDisplay
                            value={toKrw(a.currentValue, a.fxRateToKrw)}
                          />
                        </dd>
                      </div>
                      {view === "all" ? (
                        <div>
                          <dt className="text-xs text-ink/50">부채</dt>
                          <dd>
                            <CurrencyDisplay value={toKrw(a.debtValue, a.fxRateToKrw)} />
                          </dd>
                        </div>
                      ) : (
                        <div>
                          <dt className="text-xs text-ink/50">금리</dt>
                          <dd>
                            {a.cash?.interestRate != null
                              ? `${a.cash.interestRate}%`
                              : "-"}
                          </dd>
                        </div>
                      )}
                    </>
                  ) : null}
                  {view === "REAL_ESTATE"
                    ? (() => {
                        const loan = a.realEstate?.loanBalance ?? a.debtValue;
                        const { equity, ltv } = calcRealEstateMetrics({
                          marketValue: a.currentValue,
                          loanBalance: loan,
                        });
                        return (
                          <>
                            <div>
                              <dt className="text-xs text-ink/50">시가</dt>
                              <dd>
                                <CurrencyDisplay value={a.currentValue} />
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">대출잔액</dt>
                              <dd>
                                <CurrencyDisplay value={loan} />
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">순자산</dt>
                              <dd>
                                <CurrencyDisplay value={equity} />
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">담보비율</dt>
                              <dd>{ltv.toFixed(1)}%</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">월 임대수입</dt>
                              <dd>
                                <CurrencyDisplay value={a.monthlyIncome} />
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">월 비용</dt>
                              <dd>
                                <CurrencyDisplay value={a.monthlyExpense} />
                              </dd>
                            </div>
                          </>
                        );
                      })()
                    : null}
                  {view === "STOCK"
                    ? (() => {
                        const s = a.stock;
                        const pnl = s
                          ? calcStockPnl({
                              quantity: s.quantity,
                              averagePrice: s.averagePrice,
                              currentPrice: s.currentPrice,
                            })
                          : null;
                        return (
                          <>
                            <div>
                              <dt className="text-xs text-ink/50">수량</dt>
                              <dd>{s?.quantity ?? "-"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">평가액</dt>
                              <dd>
                                <CurrencyDisplay
                                  value={toKrw(a.currentValue, a.fxRateToKrw)}
                                />
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">평가손익</dt>
                              <dd>
                                {pnl ? (
                                  <CurrencyDisplay
                                    value={toKrw(pnl.pnl, a.fxRateToKrw)}
                                  />
                                ) : (
                                  "-"
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-ink/50">수익률</dt>
                              <dd>
                                {pnl ? (
                                  <PercentageBadge value={pnl.returnRate} />
                                ) : (
                                  "-"
                                )}
                              </dd>
                            </div>
                          </>
                        );
                      })()
                    : null}
                  {view === "CASH" ? (
                    <>
                      <div>
                        <dt className="text-xs text-ink/50">만기</dt>
                        <dd>{a.cash?.maturityDate ?? "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-ink/50">비상자금</dt>
                        <dd>{a.cash?.isEmergencyFund ? "예" : "아니오"}</dd>
                      </div>
                    </>
                  ) : null}
                </dl>
                <p className="mt-3 text-xs text-ink/45">
                  마지막 갱신 {formatUpdatedAt(a.updatedAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? "자산 수정" : "자산 추가"}
        description="금액은 원(또는 통화 단위) 정수로 저장됩니다."
        onClose={() => setFormOpen(false)}
      >
        <AssetForm
          key={editing?.id ?? `create-${defaultType}-${formOpen}`}
          mode={editing ? "edit" : "create"}
          asset={editing}
          defaultType={defaultType}
          lockType={view !== "all"}
          onCancel={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false);
            setFeedback({
              tone: "ok",
              text: editing ? "자산을 수정했습니다." : "자산을 추가했습니다.",
            });
            router.refresh();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="자산 삭제"
        description={
          deleting
            ? `"${deleting.name}"을(를) 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
            : undefined
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        busy={deleteBusy}
        onCancel={() => !deleteBusy && setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
