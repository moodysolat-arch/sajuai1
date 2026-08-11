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
      await expect(page.getByRole("heading", { name: "종합 재물운" })).toBeVisible();
      await expect(page.getByText("올해 재물운")).toBeVisible();
      await expect(page.getByText("우선 실행 과제")).toBeVisible();
      await expect(page.getByText("재물 유형").first()).toBeVisible();

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
