import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`);
});
page.on("pageerror", (e) => logs.push(`PAGEERROR: ${e.message}\n${e.stack}`));
await page.goto("http://127.0.0.1:3000/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const titles = [...document.querySelectorAll("h2")].map((h) => h.textContent);
  const chartTitle = [...document.querySelectorAll("h2")].find((h) =>
    h.textContent?.includes("자산 구성"),
  );
  const card = chartTitle?.closest("section");
  const sized = card?.querySelector(".h-52, .sm\\:h-56");
  return {
    titles,
    cardHtml: card?.innerHTML.slice(0, 800) ?? null,
    sizedBox: sized
      ? {
          w: sized.clientWidth,
          h: sized.clientHeight,
          childCount: sized.childElementCount,
          inner: sized.innerHTML.slice(0, 400),
        }
      : null,
  };
});

console.log(JSON.stringify({ info, logs }, null, 2));
await browser.close();
