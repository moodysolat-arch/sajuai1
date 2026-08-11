import {
  CalendarRange,
  Compass,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobileTab?: boolean;
};

/** 재물 나침반 IA: 종합 재물운 + 운세·과제 병렬 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "종합 재물운", icon: LayoutDashboard, mobileTab: true },
  { href: "/fortune", label: "운세 캘린더", icon: CalendarRange, mobileTab: true },
  { href: "/actions", label: "실행 과제", icon: ListChecks, mobileTab: true },
  { href: "/", label: "재물나침반", icon: Sparkles },
  { href: "/wealth-type", label: "재물 성향", icon: Compass },
  { href: "/settings", label: "설정", icon: Settings },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function formatAsOfDate(date = new Date()) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
