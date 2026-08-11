/**
 * 금액 규칙: DB·API·도메인 모두 원(또는 통화 단위) 정수.
 * KRW 환산 = value * fxRateToKrw (둘 다 Int).
 */

export type MoneyInput = number | string | { toString(): string } | null | undefined;

export function toNumber(value: MoneyInput): number {
  if (value == null) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** 원 단위 정수로 정규화 */
export function toWon(value: MoneyInput): number {
  return Math.round(toNumber(value));
}

export function toKrw(value: MoneyInput, fxRateToKrw: MoneyInput = 1): number {
  return toWon(value) * toWon(fxRateToKrw);
}

export function formatKrw(value: MoneyInput, options?: { compact?: boolean; masked?: boolean }) {
  if (options?.masked) return "••••••";
  const amount = toWon(value);
  if (options?.compact) {
    if (Math.abs(amount) >= 100_000_000) {
      return `${(amount / 100_000_000).toFixed(1)}억`;
    }
    if (Math.abs(amount) >= 10_000) {
      return `${(amount / 10_000).toFixed(0)}만`;
    }
  }
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

/** API JSON용 — 항상 number(정수) */
export function serializeMoney(value: MoneyInput): number {
  return toWon(value);
}
