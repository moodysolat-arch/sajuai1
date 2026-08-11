/**
 * /dashboard 스크린샷: 360 / 768 / 1440
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const widths = [360, 768, 1440];
const outDir = path.join(process.cwd(), "tmp", "dashboard-shots");

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width === 360 ? 800 : 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const res = await page.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const file = path.join(outDir, `dashboard-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
      const clientWidth = doc.clientWidth;
      const cards = [...document.querySelectorAll("section, [class*='card'], main *")].filter(
        (el) => el instanceof HTMLElement,
      );
      const overlappingHints = cards.filter((el) => {
        const style = getComputedStyle(el);
        return style.position === "absolute" || style.position === "fixed";
      }).length;
      return {
        horizontalOverflow: scrollWidth > clientWidth + 1,
        scrollWidth,
        clientWidth,
        absoluteOrFixedCount: overlappingHints,
      };
    });

    const text = await page.locator("h1").first().textContent();
    results.push({
      width,
      status: res?.status() ?? 0,
      heading: text?.trim(),
      file,
      ...overflow,
    });
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify({ base, outDir, results }, null, 2));
  if (results.some((r) => r.status !== 200 || r.horizontalOverflow)) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
