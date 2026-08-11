"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "sajuai:mask";

let hydrated = false;

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  const saved = localStorage.getItem(STORAGE_KEY) === "1";
  document.documentElement.dataset.mask = saved ? "1" : "0";
  hydrated = true;
}

function getSnapshot() {
  ensureHydrated();
  return document.documentElement.dataset.mask === "1";
}

function getServerSnapshot() {
  return false;
}

function subscribe(onStoreChange: () => void) {
  const handler = () => onStoreChange();
  window.addEventListener("sajuai:mask", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("sajuai:mask", handler);
    window.removeEventListener("storage", handler);
  };
}

function setMasked(next: boolean) {
  localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  document.documentElement.dataset.mask = next ? "1" : "0";
  window.dispatchEvent(new CustomEvent("sajuai:mask", { detail: next }));
}

type MaskContextValue = {
  masked: boolean;
  setMasked: (next: boolean) => void;
  toggle: () => void;
};

const MaskContext = createContext<MaskContextValue | null>(null);

export function MaskProvider({ children }: { children: React.ReactNode }) {
  const masked = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => setMasked(!getSnapshot()), []);
  const value = useMemo(
    () => ({ masked, setMasked, toggle }),
    [masked, toggle],
  );
  return <MaskContext.Provider value={value}>{children}</MaskContext.Provider>;
}

export function useMask() {
  const ctx = useContext(MaskContext);
  if (!ctx) {
    throw new Error("useMask must be used within MaskProvider");
  }
  return ctx;
}
