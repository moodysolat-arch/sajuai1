import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "tmp", "viewport-qa");
const routes = [
  { path: "/dashboard", name: "dashboard" },
  { path: "/", name: "home" },
  { path: "/fortune", name: "fortune" },
  { path: "/assets", name: "assets" },
  { path: "/wealth-type", name: "wealth-type" },
  { path: "/actions", name: "actions" },
  { path: "/settings", name: "settings" },
] as const;

const widths = [360, 768, 1440] as const;

test.beforeAll(() => {
  fs.mkdirSync(outDir, { recursive: true });
});

for (const width of widths) {
  for (const route of routes) {
    test(`${route.name} @ ${width}px — no horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 360 ? 840 : 960 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      await page.screenshot({
        path: path.join(outDir, `${route.name}-${width}.png`),
        fullPage: true,
      });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          horizontal: doc.scrollWidth > doc.clientWidth + 1,
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });
      expect(overflow.horizontal, JSON.stringify(overflow)).toBe(false);

      // 빈 버튼·링크 없는지 스모크
      const emptyControls = await page.evaluate(() => {
        const bad: string[] = [];
        document.querySelectorAll("button, a").forEach((el) => {
          const text = (el.textContent || "").replace(/\s+/g, " ").trim();
          const aria = el.getAttribute("aria-label") || "";
          const sr = el.querySelector(".sr-only")?.textContent?.trim() || "";
          if (!text && !aria && !sr) bad.push(el.outerHTML.slice(0, 120));
        });
        return bad.slice(0, 5);
      });
      expect(emptyControls).toEqual([]);
    });
  }
}
