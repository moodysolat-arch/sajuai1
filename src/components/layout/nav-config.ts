import {
  Building2,
  CalendarRange,
  CircleDollarSign,
  Compass,
  LayoutDashboard,
  ListChecks,
  Settings,
  Landmark,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobileTab?: boolean;
};

/** 재물 나침반 IA: 재무 대시보드 + 사주 재물운 병렬 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, mobileTab: true },
  { href: "/fortune", label: "운세 캘린더", icon: CalendarRange, mobileTab: true },
  { href: "/assets", label: "총 자산", icon: Wallet, mobileTab: true },
  { href: "/assets/real-estate", label: "부동산", icon: Building2 },
  { href: "/assets/stocks", label: "주식", icon: Landmark },
  { href: "/assets/cash", label: "현금", icon: CircleDollarSign },
  { href: "/actions", label: "실행 과제", icon: ListChecks, mobileTab: true },
  { href: "/", label: "재물운 홈", icon: Sparkles },
  { href: "/wealth-type", label: "재물 성향", icon: Compass },
  { href: "/settings", label: "설정", icon: Settings },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/assets") return pathname === "/assets";
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
