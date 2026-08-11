import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("핵심 시나리오", () => {
  test("1. 대시보드 진입", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
    await expect(page.getByText("총자산").first()).toBeVisible();
    await expect(page.getByText("재무 건강").first()).toBeVisible();
  });

  test("2. 자산 추가·수정·삭제", async ({ page }) => {
    const name = `E2E현금-${Date.now()}`;
    const renamed = `${name}-수정`;

    await page.goto("/assets");
    await expect(page.getByRole("heading", { name: "총 자산" })).toBeVisible();

    await page.getByRole("button", { name: "자산 추가" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.locator("select").first().selectOption("CASH");
    await dialog.getByLabel("계좌명").fill(name);
    await dialog.getByLabel("잔액").fill("1234567");
    await dialog.getByRole("button", { name: "저장" }).click();

    await expect(page.getByRole("link", { name }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: `${name} 수정` }).first().click();
    const editDialog = page.getByRole("dialog");
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("계좌명").fill(renamed);
    await editDialog.getByRole("button", { name: "저장" }).click();
    await expect(page.getByRole("link", { name: renamed }).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: `${renamed} 삭제` }).first().click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: "삭제" }).click();
    await expect(page.getByRole("link", { name: renamed })).toHaveCount(0, {
      timeout: 15_000,
    });
  });

  test("3. 운세 생성", async ({ page }) => {
    const year = new Date().getFullYear();
    await page.goto("/");
    await page.getByRole("button", { name: new RegExp(`${year}년 운세`) }).click();
    await expect(page.getByText(/생성 중|참고용|12개월|재물/).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.goto("/fortune");
    await expect(page.getByRole("heading", { name: "운세 캘린더" })).toBeVisible();
    await expect(page.getByText(/시주|대운|세운|참고용/).first()).toBeVisible();
  });

  test("4. 재물 유형 확인", async ({ page }) => {
    await page.goto("/wealth-type");
    await expect(page.getByRole("heading", { level: 1, name: "재물 유형" })).toBeVisible();
    await expect(page.getByText(/형$/).first()).toBeVisible();
    await expect(page.getByText("점수 구성")).toBeVisible();
  });

  test("5. 실행 과제 완료", async ({ page }) => {
    await page.goto("/actions");
    await expect(page.getByRole("heading", { name: "실행 과제" })).toBeVisible();

    const completeBtn = page.getByRole("button", { name: "완료" }).first();
    await expect(completeBtn).toBeVisible({ timeout: 15_000 });
    await completeBtn.click();
    await expect(page.getByText(/상태를 변경했습니다|완료/).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("6. 데모 초기화", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /데모 초기화/ }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "초기화" }).click();
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.getByText("총자산").first()).toBeVisible();
  });
});
