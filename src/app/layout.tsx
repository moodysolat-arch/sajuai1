import type { Metadata } from "next";
import { AppFrame } from "@/components/layout/app-frame";
import "./globals.css";

export const metadata: Metadata = {
  title: "재물 나침반",
  description:
    "사주 해석 기반 재물운·성향·참고 과제를 확인하는 단일 사용자 MVP. 투자 권유·수익 보장이 아닙니다.",
  applicationName: "재물 나침반",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full antialiased">
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
