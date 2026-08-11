import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const outDir = path.join(process.cwd(), "tmp", "dashboard-shots");

test.describe("dashboard viewports", () => {
  test.beforeAll(() => {
    fs.mkdirSync(outDir, { recursive: true });
  });

  for (const width of [360, 768, 1440] as const) {
    test(`renders at ${width}px without horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
      await expect(page.getByText("총자산")).toBeVisible();
      await expect(page.getByText("내 재물은 어디에 있나")).toBeVisible();
      await expect(page.getByText("재무 건강")).toBeVisible();

      await page.screenshot({
        path: path.join(outDir, `dashboard-${width}.png`),
        fullPage: true,
      });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth > doc.clientWidth + 1;
      });
      expect(overflow).toBe(false);
    });
  }
});
