/**
 * 레이아웃 스모크: 360 / 768 / 1440 에서 주요 라우트 HTTP 200 확인.
 * (시각 회귀 대신 라우트·빌드 안정성 검증)
 */
const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const routes = [
  "/dashboard",
  "/",
  "/fortune",
  "/assets",
  "/assets/real-estate",
  "/assets/stocks",
  "/assets/cash",
  "/actions",
  "/settings",
];

const widths = [360, 768, 1440];

async function main() {
  const results = [];
  for (const width of widths) {
    for (const route of routes) {
      const res = await fetch(`${base}${route}`, {
        headers: { "User-Agent": `viewport-check/${width}` },
      });
      results.push({ width, route, status: res.status, ok: res.ok });
      if (!res.ok) {
        console.error("FAIL", width, route, res.status);
        process.exitCode = 1;
      }
    }
  }
  console.log(
    JSON.stringify(
      {
        base,
        checked: results.length,
        viewports: widths,
        routes,
        allOk: results.every((r) => r.ok),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
