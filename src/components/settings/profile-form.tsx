"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  INVESTMENT_HORIZON_LABELS,
  INVESTMENT_HORIZONS,
  PREFERRED_ACTIVITIES,
  PREFERRED_ACTIVITY_LABELS,
  type InvestmentHorizon,
  type PreferredActivity,
} from "@/domain/enums";
import { Button } from "@/components/ui/button";

type Profile = {
  name: string;
  calendarType: "SOLAR" | "LUNAR";
  birthDate: string;
  birthTime: string | null;
  timezone: string;
  riskLevel: "CONSERVATIVE" | "BALANCED" | "GROWTH";
  goal: string;
  monthlyExpense: string | number;
  preferredActivity?: string;
  investmentHorizon?: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...profile,
    birthTime: profile.birthTime ?? "",
    birthTimeUnknown: !profile.birthTime,
    monthlyExpense: Number(profile.monthlyExpense),
    preferredActivity: (profile.preferredActivity ?? "LEARNING") as PreferredActivity,
    investmentHorizon: (profile.investmentHorizon ?? "Y3_TO_7") as InvestmentHorizon,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          calendarType: form.calendarType,
          birthDate: form.birthDate,
          birthTime: form.birthTimeUnknown ? null : form.birthTime || null,
          timezone: form.timezone,
          riskLevel: form.riskLevel,
          goal: form.goal,
          monthlyExpense: form.monthlyExpense,
          preferredActivity: form.preferredActivity,
          investmentHorizon: form.investmentHorizon,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "저장에 실패했습니다.");
        return;
      }
      setMessage("저장되었습니다.");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="이름">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="양력/음력">
          <select
            className="input"
            value={form.calendarType}
            onChange={(e) =>
              setForm({ ...form, calendarType: e.target.value as Profile["calendarType"] })
            }
          >
            <option value="SOLAR">양력</option>
            <option value="LUNAR">음력</option>
          </select>
        </Field>
        <Field label="생년월일">
          <input
            className="input"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
            required
          />
        </Field>
        <Field label="출생 시각">
          <input
            className="input"
            type="time"
            value={form.birthTime}
            disabled={form.birthTimeUnknown}
            onChange={(e) => setForm({ ...form, birthTime: e.target.value })}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={form.birthTimeUnknown}
            onChange={(e) =>
              setForm({
                ...form,
                birthTimeUnknown: e.target.checked,
                birthTime: e.target.checked ? "" : form.birthTime,
              })
            }
          />
          출생 시각 모름
        </label>
        <Field label="시간대">
          <input
            className="input"
            value={form.timezone}
            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          />
        </Field>
        <Field label="위험선호">
          <select
            className="input"
            value={form.riskLevel}
            onChange={(e) =>
              setForm({ ...form, riskLevel: e.target.value as Profile["riskLevel"] })
            }
          >
            <option value="CONSERVATIVE">보수</option>
            <option value="BALANCED">균형</option>
            <option value="GROWTH">성장</option>
          </select>
        </Field>
        <Field label="선호 활동">
          <select
            className="input"
            value={form.preferredActivity}
            onChange={(e) =>
              setForm({
                ...form,
                preferredActivity: e.target.value as PreferredActivity,
              })
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
            value={form.investmentHorizon}
            onChange={(e) =>
              setForm({
                ...form,
                investmentHorizon: e.target.value as InvestmentHorizon,
              })
            }
          >
            {INVESTMENT_HORIZONS.map((h) => (
              <option key={h} value={h}>
                {INVESTMENT_HORIZON_LABELS[h]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="월 생활비">
          <input
            className="input"
            type="number"
            min={1}
            value={form.monthlyExpense}
            onChange={(e) => setForm({ ...form, monthlyExpense: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="재무 목표">
        <textarea
          className="input min-h-24"
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
          required
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : "프로필 저장"}
        </Button>
        {message ? <p className="text-sm text-positive">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-ink/65">{label}</span>
      {children}
    </label>
  );
}
