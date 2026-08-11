"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  INVESTMENT_HORIZON_LABELS,
  INVESTMENT_HORIZONS,
  PREFERRED_ACTIVITIES,
  PREFERRED_ACTIVITY_LABELS,
  type InvestmentHorizon,
  type PreferredActivity,
  type RiskLevel,
} from "@/domain/enums";
import { DisclaimerNotice } from "@/components/ui/disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "sajuai:onboarding-draft";

type Draft = {
  step: number;
  name: string;
  goal: string;
  calendarType: "SOLAR" | "LUNAR";
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  timezone: string;
  riskLevel: RiskLevel;
  preferredActivity: PreferredActivity;
  investmentHorizon: InvestmentHorizon;
  monthlyExpense: number;
};

const emptyDraft = (): Draft => ({
  step: 1,
  name: "",
  goal: "",
  calendarType: "SOLAR",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  timezone: "Asia/Seoul",
  riskLevel: "BALANCED",
  preferredActivity: "LEARNING",
  investmentHorizon: "Y3_TO_7",
  monthlyExpense: 0,
});

let draftCache: Draft | null = null;
const draftListeners = new Set<() => void>();

function loadDraftFromStorage(): Draft {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch {
    return emptyDraft();
  }
}

function readDraft(): Draft {
  if (typeof window === "undefined") return emptyDraft();
  if (!draftCache) draftCache = loadDraftFromStorage();
  return draftCache;
}

function writeDraft(next: Draft) {
  draftCache = next;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  draftListeners.forEach((l) => l());
}

function clearDraftStorage() {
  draftCache = emptyDraft();
  sessionStorage.removeItem(STORAGE_KEY);
  draftListeners.forEach((l) => l());
}

function subscribeDraft(onStoreChange: () => void) {
  draftListeners.add(onStoreChange);
  return () => draftListeners.delete(onStoreChange);
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-ink/65">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

export function OnboardingWizard() {
  const router = useRouter();
  const isClient = useIsClient();
  const draft = useSyncExternalStore(subscribeDraft, readDraft, emptyDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const step = draft.step;

  const patch = useCallback((partial: Partial<Draft>) => {
    writeDraft({ ...readDraft(), ...partial });
    setError("");
    setFieldErrors({});
  }, []);

  function validateStep(n: number): boolean {
    const errs: Record<string, string[]> = {};
    if (n === 1) {
      if (!draft.name.trim()) errs.name = ["이름을 입력하세요."];
      if (!draft.goal.trim()) errs.goal = ["재무 목표를 입력하세요."];
    }
    if (n === 2) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate)) {
        errs.birthDate = ["생년월일을 선택하세요."];
      }
      if (!draft.birthTimeUnknown && !/^\d{2}:\d{2}$/.test(draft.birthTime)) {
        errs.birthTime = ["출생 시각을 입력하거나 모름을 선택하세요."];
      }
      if (!draft.timezone.trim()) errs.timezone = ["시간대를 입력하세요."];
    }
    if (n === 3) {
      if (!Number.isFinite(draft.monthlyExpense) || draft.monthlyExpense < 1) {
        errs.monthlyExpense = ["월 생활비를 1원 이상 입력하세요."];
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validateStep(step)) return;
    patch({ step: Math.min(4, step + 1) });
  }

  function back() {
    patch({ step: Math.max(1, step - 1) });
  }

  async function startDemo() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "데모 시작에 실패했습니다.");
        return;
      }
      clearDraftStorage();
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function goToLogin() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      clearDraftStorage();
      window.location.assign("/login");
    } catch {
      setError("로그인 화면으로 이동하지 못했습니다.");
      setBusy(false);
    }
  }

  const isProd = process.env.NODE_ENV === "production";

  async function finish() {
    if (busy || !validateStep(3)) return;
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          goal: draft.goal.trim(),
          calendarType: draft.calendarType,
          birthDate: draft.birthDate,
          birthTime: draft.birthTimeUnknown ? null : draft.birthTime,
          birthTimeUnknown: draft.birthTimeUnknown,
          timezone: draft.timezone,
          riskLevel: draft.riskLevel,
          preferredActivity: draft.preferredActivity,
          investmentHorizon: draft.investmentHorizon,
          monthlyExpense: draft.monthlyExpense,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "저장에 실패했습니다.");
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        return;
      }
      clearDraftStorage();
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const summaryRows = useMemo(
    () => [
      ["이름", draft.name],
      ["재무 목표", draft.goal],
      ["달력", draft.calendarType === "SOLAR" ? "양력" : "음력"],
      ["생년월일", draft.birthDate],
      ["출생 시각", draft.birthTimeUnknown ? "모름" : draft.birthTime || "—"],
      ["시간대", draft.timezone],
      [
        "위험 감수",
        draft.riskLevel === "CONSERVATIVE"
          ? "보수"
          : draft.riskLevel === "GROWTH"
            ? "성장"
            : "균형",
      ],
      ["선호 활동", PREFERRED_ACTIVITY_LABELS[draft.preferredActivity]],
      ["투자 기간", INVESTMENT_HORIZON_LABELS[draft.investmentHorizon]],
      ["월 생활비", `${draft.monthlyExpense.toLocaleString("ko-KR")}원`],
    ],
    [draft],
  );

  if (!isClient) {
    return <p className="text-sm text-ink/55">불러오는 중…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-primary">ONBOARDING</p>
        <h1 className="mt-1 font-display text-[28px] font-semibold">시작하기</h1>
        <p className="mt-2 text-sm text-ink/65">
          단계 {step} / 4 · 입력은 이 기기에만 임시 저장되며 URL에 실리지 않습니다.
        </p>
      </div>

      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <DisclaimerNotice compact />

      <Card>
        {step === 1 ? (
          <>
            <CardTitle>이름과 재무 목표</CardTitle>
            <CardDesc>나를 부르는 이름과 이번 시기의 재물 목표</CardDesc>
            <div className="mt-4 space-y-3">
              <Field label="이름" error={fieldErrors.name?.[0]}>
                <input
                  className="input"
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  autoComplete="name"
                />
              </Field>
              <Field label="재무 목표" error={fieldErrors.goal?.[0]}>
                <textarea
                  className="input min-h-24"
                  value={draft.goal}
                  onChange={(e) => patch({ goal: e.target.value })}
                  placeholder="예: 비상금 확보와 균형 잡힌 자산 습관"
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <CardTitle>출생 정보</CardTitle>
            <CardDesc>양력/음력 · 생년월일 · 출생 시각(또는 모름)</CardDesc>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="양력/음력">
                <select
                  className="input"
                  value={draft.calendarType}
                  onChange={(e) =>
                    patch({ calendarType: e.target.value as Draft["calendarType"] })
                  }
                >
                  <option value="SOLAR">양력</option>
                  <option value="LUNAR">음력</option>
                </select>
              </Field>
              <Field label="시간대" error={fieldErrors.timezone?.[0]}>
                <input
                  className="input"
                  value={draft.timezone}
                  onChange={(e) => patch({ timezone: e.target.value })}
                />
              </Field>
              <Field label="생년월일" error={fieldErrors.birthDate?.[0]}>
                <input
                  className="input"
                  type="date"
                  value={draft.birthDate}
                  onChange={(e) => patch({ birthDate: e.target.value })}
                />
              </Field>
              <Field label="출생 시각" error={fieldErrors.birthTime?.[0]}>
                <input
                  className="input"
                  type="time"
                  value={draft.birthTime}
                  disabled={draft.birthTimeUnknown}
                  onChange={(e) => patch({ birthTime: e.target.value })}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.birthTimeUnknown}
                  onChange={(e) =>
                    patch({
                      birthTimeUnknown: e.target.checked,
                      birthTime: e.target.checked ? "" : draft.birthTime,
                    })
                  }
                />
                출생 시각 모름 (시주 미상)
              </label>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <CardTitle>성향과 생활비</CardTitle>
            <CardDesc>위험 감수 · 선호 활동 · 투자 기간 · 월 생활비</CardDesc>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="위험 감수">
                <select
                  className="input"
                  value={draft.riskLevel}
                  onChange={(e) => patch({ riskLevel: e.target.value as RiskLevel })}
                >
                  <option value="CONSERVATIVE">보수</option>
                  <option value="BALANCED">균형</option>
                  <option value="GROWTH">성장</option>
                </select>
              </Field>
              <Field label="선호 활동">
                <select
                  className="input"
                  value={draft.preferredActivity}
                  onChange={(e) =>
                    patch({ preferredActivity: e.target.value as PreferredActivity })
                  }
                >
                  {PREFERRED_ACTIVITIES.map((a) => (
                    <option key={a} value={a}>
                      {PREFERRED_ACTIVITY_LABELS[a]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="투자 기간">
                <select
                  className="input"
                  value={draft.investmentHorizon}
                  onChange={(e) =>
                    patch({ investmentHorizon: e.target.value as InvestmentHorizon })
                  }
                >
                  {INVESTMENT_HORIZONS.map((h) => (
                    <option key={h} value={h}>
                      {INVESTMENT_HORIZON_LABELS[h]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="월 생활비(원)" error={fieldErrors.monthlyExpense?.[0]}>
                <input
                  className="input"
                  type="number"
                  min={1}
                  step={10000}
                  value={draft.monthlyExpense || ""}
                  onChange={(e) => patch({ monthlyExpense: Number(e.target.value) })}
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <CardTitle>입력 확인</CardTitle>
            <CardDesc>저장하면 재물 유형을 계산하고 데모 운세를 생성합니다.</CardDesc>
            <dl className="mt-4 space-y-2 text-sm">
              {summaryRows.map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-3 border-b border-border/70 py-2"
                >
                  <dt className="shrink-0 text-ink/55">{k}</dt>
                  <dd className="min-w-0 break-words text-right text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {step > 1 ? (
              <Button type="button" variant="secondary" onClick={back} disabled={busy}>
                뒤로
              </Button>
            ) : null}
            {isProd ? (
              <Button type="button" variant="ghost" onClick={goToLogin} disabled={busy}>
                로그인으로
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={startDemo} disabled={busy}>
                데모로 둘러보기
              </Button>
            )}
          </div>
          {step < 4 ? (
            <Button type="button" onClick={next} disabled={busy}>
              다음
            </Button>
          ) : (
            <Button type="button" onClick={finish} disabled={busy}>
              {busy ? "저장 중..." : "시작하기"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
