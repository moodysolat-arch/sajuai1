import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const absolute =
  dbUrl.startsWith("file:") && !path.isAbsolute(dbUrl.slice(5))
    ? `file:${path.join(process.cwd(), dbUrl.slice(5))}`
    : dbUrl;

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: absolute }),
});

async function main() {
  const profile = await prisma.userProfile.findUnique({
    where: { id: "demo-profile-001" },
  });
  const assets = await prisma.asset.groupBy({
    by: ["type"],
    _count: true,
  });
  const snapshots = await prisma.valuationSnapshot.count();
  const fortunes = await prisma.fortuneSnapshot.count();
  const actions = await prisma.actionTask.count();

  const report = {
    profile: profile
      ? {
          id: profile.id,
          name: profile.name,
          riskLevel: profile.riskLevel,
          monthlyExpense: profile.monthlyExpense,
        }
      : null,
    assetsByType: Object.fromEntries(assets.map((a) => [a.type, a._count])),
    assetTotal: await prisma.asset.count(),
    snapshots,
    fortunes,
    actions,
  };

  console.log(JSON.stringify(report, null, 2));

  const ok =
    !!profile &&
    profile.monthlyExpense === 2_800_000 &&
    report.assetTotal === 7 &&
    (report.assetsByType.REAL_ESTATE ?? 0) === 1 &&
    (report.assetsByType.STOCK ?? 0) === 3 &&
    (report.assetsByType.CASH ?? 0) === 2 &&
    (report.assetsByType.BUSINESS ?? 0) === 1 &&
    snapshots === 42 && // 7 assets * 6 months
    fortunes >= 1 &&
    actions >= 3;

  if (!ok) {
    console.error("VERIFY FAILED");
    process.exit(1);
  }
  console.log("VERIFY OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
