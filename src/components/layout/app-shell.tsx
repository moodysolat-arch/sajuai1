"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { DemoResetButton } from "@/components/layout/demo-reset-button";
import { MaskProvider } from "@/components/layout/mask-context";
import { MaskToggle } from "@/components/layout/mask-toggle";
import { OnboardingGate } from "@/components/layout/onboarding-gate";
import { NAV_ITEMS, formatAsOfDate, isNavActive } from "@/components/layout/nav-config";

const navLinkClass =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className={cn(compact ? "" : "mb-8 px-2")}>
      <p className="text-xs font-medium tracking-[0.18em] text-primary">WEALTH COMPASS</p>
      <p
        className={cn(
          "font-display font-semibold tracking-tight text-ink",
          compact ? "text-lg" : "mt-1 text-2xl",
        )}
      >
        재물 나침반
      </p>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-ink/55">사주 재물운 · 참고용 해석</p>
      ) : null}
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
  idPrefix,
}: {
  pathname: string;
  onNavigate?: () => void;
  idPrefix: string;
}) {
  return (
    <nav aria-label="주요 메뉴" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            id={`${idPrefix}-${item.href.replace(/\//g, "-") || "home"}`}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              navLinkClass,
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-ink/70 hover:bg-[#F1F3F7] hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  needsOnboarding = false,
  maskDefault = false,
  isDemo = false,
  userEmail = null,
}: {
  children: React.ReactNode;
  needsOnboarding?: boolean;
  maskDefault?: boolean;
  isDemo?: boolean;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerTitleId = useId();
  const asOf = formatAsOfDate();
  const mobileTabs = NAV_ITEMS.filter((n) => n.mobileTab);
  const onboardingMode =
    pathname.startsWith("/onboarding") || pathname.startsWith("/login");

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <MaskProvider>
      <OnboardingGate needsOnboarding={needsOnboarding} maskDefault={maskDefault}>
        <div className="min-h-screen bg-canvas text-ink">
          {onboardingMode ? (
            <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">
              {children}
            </main>
          ) : (
            <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
              <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-border bg-card px-4 py-6 md:block">
                <Brand />
                <NavLinks pathname={pathname} idPrefix="desk" />
                {isDemo ? (
                  <p className="mt-6 px-2 text-[11px] leading-5 text-ink/45">
                    데모 모드 · 설정에서 초기화할 수 있습니다.
                  </p>
                ) : null}
              </aside>

              <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden pb-[4.5rem] md:pb-0">
                <header className="sticky top-0 z-30 border-b border-border bg-canvas/95 backdrop-blur">
                  <div className="flex min-w-0 items-center gap-2 px-4 py-3 md:px-8">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 md:hidden"
                      aria-expanded={drawerOpen}
                      aria-controls="mobile-drawer"
                      onClick={() => setDrawerOpen(true)}
                    >
                      <Menu className="h-5 w-5" aria-hidden />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>

                    <div className="min-w-0 flex-1 truncate md:hidden">
                      <Brand compact />
                    </div>

                    <p className="ml-auto hidden text-xs text-ink/55 sm:block md:ml-0">
                      기준일 <span className="tabular-nums text-ink/80">{asOf}</span>
                    </p>

                    <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:ml-auto">
                      {userEmail ? (
                        <span className="hidden max-w-[10rem] truncate text-xs text-ink/50 lg:inline">
                          {userEmail}
                        </span>
                      ) : null}
                      <MaskToggle />
                      <DemoResetButton />
                      <LogoutButton />
                    </div>
                  </div>
                  <p className="border-t border-border px-4 py-1.5 text-[11px] text-ink/50 sm:hidden">
                    기준일 <span className="tabular-nums">{asOf}</span>
                  </p>
                </header>

                <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
                  {children}
                </main>
              </div>
            </div>
          )}

          {!onboardingMode ? (
            <nav
              aria-label="모바일 바로가기"
              className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 px-1 py-2 backdrop-blur md:hidden"
            >
              {mobileTabs.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md px-1 py-1 text-[10px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                      active ? "text-primary" : "text-ink/55",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {drawerOpen && !onboardingMode ? (
            <div className="fixed inset-0 z-40 md:hidden" role="presentation">
              <button
                type="button"
                className="absolute inset-0 bg-ink/35 focus-visible:outline-none"
                aria-label="메뉴 닫기"
                onClick={() => setDrawerOpen(false)}
              />
              <div
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby={drawerTitleId}
                className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-r border-border bg-card p-4 shadow-[0_8px_24px_rgba(23,32,51,0.12)]"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div id={drawerTitleId}>
                    <Brand />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" aria-hidden />
                    <span className="sr-only">닫기</span>
                  </Button>
                </div>
                <NavLinks
                  pathname={pathname}
                  idPrefix="drawer"
                  onNavigate={() => setDrawerOpen(false)}
                />
              </div>
            </div>
          ) : null}
        </div>
      </OnboardingGate>
    </MaskProvider>
  );
}
