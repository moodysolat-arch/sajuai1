import { test, expect } from "@playwright/test";

test("홈에 재물 나침반 제목이 보인다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "재물 나침반" })).toBeVisible();
});
