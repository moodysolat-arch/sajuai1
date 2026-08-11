"use client";

import { cloneElement, isValidElement, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AssetListItem } from "@/components/assets/asset-types";
import { ASSET_TYPE_LABELS, type AssetType } from "@/domain/enums";

type FormState = {
  type: AssetType;
  name: string;
  institutionOrLocation: string;
  currency: string;
  fxRateToKrw: number;
  currentValue: number;
  debtValue: number;
  monthlyIncome: number;
  monthlyExpense: number;
  memo: string;
  address: string;
  purchasePrice: number;
  loanBalance: number;
  interestRate: number;
  leaseType: string;
  nextReviewDate: string;
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  sector: string;
  accountType: string;
  maturityDate: string;
  isEmergencyFund: boolean;
  ownershipRate: number;
  valuationBasis: string;
  liquidityGrade: string;
};

const empty = (type: AssetType = "CASH"): FormState => ({
  type,
  name: "",
  institutionOrLocation: "",
  currency: "KRW",
  fxRateToKrw: 1,
  currentValue: 0,
  debtValue: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  memo: "",
  address: "",
  purchasePrice: 0,
  loanBalance: 0,
  interestRate: 0,
  leaseType: "",
  nextReviewDate: "",
  ticker: "",
  quantity: 1,
  averagePrice: 0,
  currentPrice: 0,
  sector: "",
  accountType: "입출금",
  maturityDate: "",
  isEmergencyFund: false,
  ownershipRate: 100,
  valuationBasis: "",
  liquidityGrade: "중",
});

function fromAsset(asset: AssetListItem): FormState {
  return {
    ...empty(asset.type),
    name: asset.name,
    institutionOrLocation: asset.institutionOrLocation ?? "",
    currency: asset.currency,
    fxRateToKrw: asset.fxRateToKrw,
    currentValue: asset.currentValue,
    debtValue: asset.debtValue,
    monthlyIncome: asset.monthlyIncome,
    monthlyExpense: asset.monthlyExpense,
    memo: asset.memo ?? "",
    address: asset.realEstate?.address ?? "",
    purchasePrice: asset.realEstate?.purchasePrice ?? 0,
    loanBalance: asset.realEstate?.loanBalance ?? asset.debtValue,
    interestRate: Number(asset.realEstate?.interestRate ?? asset.cash?.interestRate ?? 0),
    leaseType: asset.realEstate?.leaseType ?? "",
    nextReviewDate: asset.realEstate?.nextReviewDate ?? "",
    ticker: asset.stock?.ticker ?? "",
    quantity: asset.stock?.quantity ?? 1,
    averagePrice: asset.stock?.averagePrice ?? 0,
    currentPrice: asset.stock?.currentPrice ?? 0,
    sector: asset.stock?.sector ?? "",
    accountType: asset.cash?.accountType ?? "입출금",
    maturityDate: asset.cash?.maturityDate ?? "",
    isEmergencyFund: asset.cash?.isEmergencyFund ?? false,
    ownershipRate: Number(asset.business?.ownershipRate ?? 100),
    valuationBasis: asset.business?.valuationBasis ?? "",
    liquidityGrade: asset.business?.liquidityGrade ?? "중",
  };
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error?.length ? true : undefined,
        "aria-describedby": error?.length ? errorId : undefined,
      })
    : children;

  return (
    <div className={`text-sm ${className ?? ""}`}>
      <label htmlFor={id} className="mb-1 block text-ink/65">
        {label}
      </label>
      {control}
      {error?.length ? (
        <span id={errorId} role="alert" className="mt-1 block text-xs text-danger">
          {error[0]}
        </span>
      ) : null}
    </div>
  );
}

export function AssetForm({
  mode,
  asset,
  defaultType,
  lockType,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  asset?: AssetListItem | null;
  defaultType?: AssetType;
  lockType?: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState(() =>
    mode === "edit" && asset ? fromAsset(asset) : empty(defaultType ?? "CASH"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      type: form.type,
      name: form.name.trim(),
      institutionOrLocation: form.institutionOrLocation.trim() || null,
      currency: form.currency,
      fxRateToKrw: form.fxRateToKrw,
      currentValue: form.currentValue,
      debtValue: form.debtValue,
      monthlyIncome: form.monthlyIncome,
      monthlyExpense: form.monthlyExpense,
      memo: form.memo.trim() || null,
    };

    if (form.type === "REAL_ESTATE") {
      payload.debtValue = form.loanBalance;
      payload.realEstate = {
        address: form.address.trim() || null,
        purchasePrice: form.purchasePrice,
        loanBalance: form.loanBalance,
        interestRate: form.interestRate,
        leaseType: form.leaseType.trim() || null,
        nextReviewDate: form.nextReviewDate || null,
      };
    }
    if (form.type === "STOCK") {
      payload.stock = {
        ticker: form.ticker.trim(),
        quantity: form.quantity,
        averagePrice: form.averagePrice,
        currentPrice: form.currentPrice,
        sector: form.sector.trim() || null,
      };
      payload.currentValue = form.quantity * form.currentPrice;
    }
    if (form.type === "CASH") {
      payload.cash = {
        accountType: form.accountType.trim() || "입출금",
        interestRate: form.interestRate,
        maturityDate: form.maturityDate || null,
        isEmergencyFund: form.isEmergencyFund,
      };
    }
    if (form.type === "BUSINESS") {
      payload.business = {
        ownershipRate: form.ownershipRate,
        valuationBasis: form.valuationBasis.trim() || null,
        liquidityGrade: form.liquidityGrade.trim() || null,
      };
    }

    try {
      const url = mode === "edit" && asset ? `/api/assets/${asset.id}` : "/api/assets";
      const res = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "저장에 실패했습니다.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }
      onSuccess();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <Field label="유형" error={fieldErrors.type} className="sm:col-span-2">
        <select
          className="input"
          value={form.type}
          disabled={lockType || mode === "edit"}
          onChange={(e) => set("type", e.target.value as AssetType)}
        >
          {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((t) => (
            <option key={t} value={t}>
              {ASSET_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={form.type === "STOCK" ? "종목명" : form.type === "CASH" ? "계좌명" : "이름"}
        error={fieldErrors.name}
        className="sm:col-span-2"
      >
        <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>

      <Field
        label={
          form.type === "CASH"
            ? "기관"
            : form.type === "REAL_ESTATE"
              ? "소재지"
              : "기관/위치"
        }
        error={fieldErrors.institutionOrLocation}
      >
        <input
          className="input"
          value={form.institutionOrLocation}
          onChange={(e) => set("institutionOrLocation", e.target.value)}
        />
      </Field>

      <Field label="통화" error={fieldErrors.currency}>
        <select
          className="input"
          value={form.currency}
          onChange={(e) => {
            const currency = e.target.value;
            set("currency", currency);
            if (currency === "KRW") set("fxRateToKrw", 1);
          }}
        >
          <option value="KRW">KRW</option>
          <option value="USD">USD</option>
        </select>
      </Field>

      {form.currency !== "KRW" ? (
        <Field label="환율(→KRW)" error={fieldErrors.fxRateToKrw}>
          <input
            className="input"
            type="number"
            min={1}
            value={form.fxRateToKrw}
            onChange={(e) => set("fxRateToKrw", Number(e.target.value))}
          />
        </Field>
      ) : null}

      {form.type === "REAL_ESTATE" ? (
        <>
          <Field label="시가" error={fieldErrors.currentValue}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.currentValue}
              onChange={(e) => set("currentValue", Number(e.target.value))}
            />
          </Field>
          <Field label="대출잔액" error={fieldErrors.loanBalance}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.loanBalance}
              onChange={(e) => set("loanBalance", Number(e.target.value))}
            />
          </Field>
          <Field label="매입가" error={fieldErrors.purchasePrice}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.purchasePrice}
              onChange={(e) => set("purchasePrice", Number(e.target.value))}
            />
          </Field>
          <Field label="금리(%)" error={fieldErrors.interestRate}>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.interestRate}
              onChange={(e) => set("interestRate", Number(e.target.value))}
            />
          </Field>
          <Field label="월 임대수입" error={fieldErrors.monthlyIncome}>
            <input
              className="input"
              type="number"
              value={form.monthlyIncome}
              onChange={(e) => set("monthlyIncome", Number(e.target.value))}
            />
          </Field>
          <Field label="월 비용" error={fieldErrors.monthlyExpense}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.monthlyExpense}
              onChange={(e) => set("monthlyExpense", Number(e.target.value))}
            />
          </Field>
          <Field label="주소" className="sm:col-span-2">
            <input
              className="input"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="임대유형">
            <input
              className="input"
              value={form.leaseType}
              onChange={(e) => set("leaseType", e.target.value)}
              placeholder="자가 / 전세 / 월세"
            />
          </Field>
        </>
      ) : null}

      {form.type === "STOCK" ? (
        <>
          <Field label="티커" error={fieldErrors.ticker}>
            <input
              className="input"
              value={form.ticker}
              onChange={(e) => set("ticker", e.target.value)}
            />
          </Field>
          <Field label="수량" error={fieldErrors.quantity}>
            <input
              className="input"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set("quantity", Number(e.target.value))}
            />
          </Field>
          <Field label="평균단가" error={fieldErrors.averagePrice}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.averagePrice}
              onChange={(e) => set("averagePrice", Number(e.target.value))}
            />
          </Field>
          <Field label="현재가" error={fieldErrors.currentPrice}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.currentPrice}
              onChange={(e) => set("currentPrice", Number(e.target.value))}
            />
          </Field>
          <Field label="섹터">
            <input
              className="input"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
            />
          </Field>
        </>
      ) : null}

      {form.type === "CASH" ? (
        <>
          <Field label="잔액" error={fieldErrors.currentValue}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.currentValue}
              onChange={(e) => set("currentValue", Number(e.target.value))}
            />
          </Field>
          <Field label="계좌유형" error={fieldErrors.accountType}>
            <input
              className="input"
              value={form.accountType}
              onChange={(e) => set("accountType", e.target.value)}
            />
          </Field>
          <Field label="금리(%)" error={fieldErrors.interestRate}>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.interestRate}
              onChange={(e) => set("interestRate", Number(e.target.value))}
            />
          </Field>
          <Field label="만기일" error={fieldErrors.maturityDate}>
            <input
              className="input"
              type="date"
              value={form.maturityDate}
              onChange={(e) => set("maturityDate", e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isEmergencyFund}
              onChange={(e) => set("isEmergencyFund", e.target.checked)}
            />
            비상자금
          </label>
        </>
      ) : null}

      {form.type === "BUSINESS" || form.type === "OTHER" ? (
        <>
          <Field label="평가액" error={fieldErrors.currentValue}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.currentValue}
              onChange={(e) => set("currentValue", Number(e.target.value))}
            />
          </Field>
          <Field label="부채" error={fieldErrors.debtValue}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.debtValue}
              onChange={(e) => set("debtValue", Number(e.target.value))}
            />
          </Field>
          {form.type === "BUSINESS" ? (
            <>
              <Field label="지분율(%)">
                <input
                  className="input"
                  type="number"
                  value={form.ownershipRate}
                  onChange={(e) => set("ownershipRate", Number(e.target.value))}
                />
              </Field>
              <Field label="평가 근거">
                <input
                  className="input"
                  value={form.valuationBasis}
                  onChange={(e) => set("valuationBasis", e.target.value)}
                />
              </Field>
            </>
          ) : null}
        </>
      ) : null}

      {(form.type === "STOCK" || form.type === "BUSINESS" || form.type === "OTHER") && (
        <>
          <Field label="월 수입" error={fieldErrors.monthlyIncome}>
            <input
              className="input"
              type="number"
              value={form.monthlyIncome}
              onChange={(e) => set("monthlyIncome", Number(e.target.value))}
            />
          </Field>
          <Field label="월 지출" error={fieldErrors.monthlyExpense}>
            <input
              className="input"
              type="number"
              min={0}
              value={form.monthlyExpense}
              onChange={(e) => set("monthlyExpense", Number(e.target.value))}
            />
          </Field>
        </>
      )}

      <Field label="메모" className="sm:col-span-2">
        <textarea
          className="input min-h-20"
          value={form.memo}
          onChange={(e) => set("memo", e.target.value)}
        />
      </Field>

      {error ? (
        <p className="text-sm text-danger sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 sm:col-span-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            취소
          </Button>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
