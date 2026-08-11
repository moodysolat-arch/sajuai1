/**
 * 재실행해도 중복되지 않는 idempotent 시드.
 * 고정 ID + upsert 사용.
 */
import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { DemoFortuneProvider } from "../src/services/fortune/demo-provider";
import { buildRecommendations } from "../src/domain/recommendations";
import { computeFinanceSummary } from "../src/domain/metrics";
import { fortuneMetaPillar } from "../src/lib/fortune-parse";

const DEMO_PROFILE_ID = "demo-profile-001";

const ASSET_IDS = {
  realEstate: "demo-asset-re-001",
  stockKr1: "demo-asset-stock-kr-001",
  stockKr2: "demo-asset-stock-kr-002",
  stockUs: "demo-asset-stock-us-001",
  cash1: "demo-asset-cash-001",
  cash2: "demo-asset-cash-002",
  business: "demo-asset-biz-001",
} as const;

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const absolute =
  dbUrl.startsWith("file:") && !path.isAbsolute(dbUrl.slice(5))
    ? `file:${path.join(process.cwd(), dbUrl.slice(5))}`
    : dbUrl;

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: absolute }),
});

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

async function upsertSnapshots(
  assetId: string,
  baseValue: number,
  baseDebt: number,
  drift = 0.01,
) {
  for (let i = 5; i >= 0; i -= 1) {
    const id = `${assetId}-snap-${i}`;
    const factor = 1 - i * drift;
    const value = Math.round(baseValue * factor);
    const debt = Math.round(baseDebt * (i === 0 ? 1 : 1.02));
    await prisma.valuationSnapshot.upsert({
      where: { id },
      create: {
        id,
        assetId,
        value,
        debt,
        capturedAt: monthsAgo(i),
      },
      update: {
        value,
        debt,
        capturedAt: monthsAgo(i),
      },
    });
  }
}

async function main() {
  // 데모 외 잔여 프로필/자산 제거 (idempotent 정리)
  await prisma.userProfile.deleteMany({
    where: { id: { not: DEMO_PROFILE_ID } },
  });
  await prisma.asset.deleteMany({
    where: { id: { notIn: Object.values(ASSET_IDS) } },
  });

  const profile = await prisma.userProfile.upsert({
    where: { id: DEMO_PROFILE_ID },
    create: {
      id: DEMO_PROFILE_ID,
      name: "김하늘",
      calendarType: "SOLAR",
      birthDate: "1990-05-15",
      birthTime: "09:30",
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      goal: "비상금 확보 후 장기 자산 배분 안정화",
      monthlyExpense: 2_800_000,
      preferredActivity: "SAVING",
      investmentHorizon: "Y3_TO_7",
      onboardingCompleted: true,
      isDemo: true,
      maskDefault: false,
    },
    update: {
      name: "김하늘",
      calendarType: "SOLAR",
      birthDate: "1990-05-15",
      birthTime: "09:30",
      timezone: "Asia/Seoul",
      riskLevel: "BALANCED",
      goal: "비상금 확보 후 장기 자산 배분 안정화",
      monthlyExpense: 2_800_000,
      preferredActivity: "SAVING",
      investmentHorizon: "Y3_TO_7",
      onboardingCompleted: true,
      isDemo: true,
    },
  });

  // 부동산 1
  await prisma.asset.upsert({
    where: { id: ASSET_IDS.realEstate },
    create: {
      id: ASSET_IDS.realEstate,
      profileId: profile.id,
      type: "REAL_ESTATE",
      name: "마포 아파트",
      institutionOrLocation: "서울 마포구",
      currency: "KRW",
      fxRateToKrw: 1,
      currentValue: 920_000_000,
      debtValue: 320_000_000,
      monthlyIncome: 0,
      monthlyExpense: 450_000,
      realEstate: {
        create: {
          address: "서울 마포구",
          purchasePrice: 780_000_000,
          loanBalance: 320_000_000,
          interestRate: 3.8,
          leaseType: "자가",
          nextReviewDate: "2026-11-01",
        },
      },
    },
    update: {
      profileId: profile.id,
      name: "마포 아파트",
      currentValue: 920_000_000,
      debtValue: 320_000_000,
      monthlyExpense: 450_000,
      realEstate: {
        upsert: {
          create: {
            address: "서울 마포구",
            purchasePrice: 780_000_000,
            loanBalance: 320_000_000,
            interestRate: 3.8,
            leaseType: "자가",
            nextReviewDate: "2026-11-01",
          },
          update: {
            address: "서울 마포구",
            purchasePrice: 780_000_000,
            loanBalance: 320_000_000,
            interestRate: 3.8,
            leaseType: "자가",
            nextReviewDate: "2026-11-01",
          },
        },
      },
    },
  });

  // 국내주식 2
  await prisma.asset.upsert({
    where: { id: ASSET_IDS.stockKr1 },
    create: {
      id: ASSET_IDS.stockKr1,
      profileId: profile.id,
      type: "STOCK",
      name: "국내 ETF 포트",
      institutionOrLocation: "키움증권",
      currentValue: 42_000_000,
      stock: {
        create: {
          ticker: "379800",
          quantity: 120,
          averagePrice: 300_000,
          currentPrice: 350_000,
          sector: "국내주식",
        },
      },
    },
    update: {
      currentValue: 42_000_000,
      stock: {
        upsert: {
          create: {
            ticker: "379800",
            quantity: 120,
            averagePrice: 300_000,
            currentPrice: 350_000,
            sector: "국내주식",
          },
          update: {
            ticker: "379800",
            quantity: 120,
            averagePrice: 300_000,
            currentPrice: 350_000,
            sector: "국내주식",
          },
        },
      },
    },
  });

  await prisma.asset.upsert({
    where: { id: ASSET_IDS.stockKr2 },
    create: {
      id: ASSET_IDS.stockKr2,
      profileId: profile.id,
      type: "STOCK",
      name: "반도체 개별주",
      institutionOrLocation: "증권사",
      currentValue: 15_000_000,
      stock: {
        create: {
          ticker: "000660",
          quantity: 50,
          averagePrice: 180_000,
          currentPrice: 300_000,
          sector: "국내주식",
        },
      },
    },
    update: {
      currentValue: 15_000_000,
      stock: {
        upsert: {
          create: {
            ticker: "000660",
            quantity: 50,
            averagePrice: 180_000,
            currentPrice: 300_000,
            sector: "국내주식",
          },
          update: {
            ticker: "000660",
            quantity: 50,
            averagePrice: 180_000,
            currentPrice: 300_000,
            sector: "국내주식",
          },
        },
      },
    },
  });

  // 해외주식 1 (USD)
  await prisma.asset.upsert({
    where: { id: ASSET_IDS.stockUs },
    create: {
      id: ASSET_IDS.stockUs,
      profileId: profile.id,
      type: "STOCK",
      name: "미국 성장 ETF",
      institutionOrLocation: "증권사",
      currency: "USD",
      fxRateToKrw: 1350,
      currentValue: 18_000,
      stock: {
        create: {
          ticker: "VOO",
          quantity: 20,
          averagePrice: 420,
          currentPrice: 900,
          sector: "해외주식",
        },
      },
    },
    update: {
      currency: "USD",
      fxRateToKrw: 1350,
      currentValue: 18_000,
      stock: {
        upsert: {
          create: {
            ticker: "VOO",
            quantity: 20,
            averagePrice: 420,
            currentPrice: 900,
            sector: "해외주식",
          },
          update: {
            ticker: "VOO",
            quantity: 20,
            averagePrice: 420,
            currentPrice: 900,
            sector: "해외주식",
          },
        },
      },
    },
  });

  // 현금 2
  await prisma.asset.upsert({
    where: { id: ASSET_IDS.cash1 },
    create: {
      id: ASSET_IDS.cash1,
      profileId: profile.id,
      type: "CASH",
      name: "비상금 통장",
      institutionOrLocation: "카카오뱅크",
      currentValue: 9_000_000,
      cash: {
        create: {
          accountType: "입출금",
          interestRate: 2.1,
          isEmergencyFund: true,
        },
      },
    },
    update: {
      currentValue: 9_000_000,
      cash: {
        upsert: {
          create: {
            accountType: "입출금",
            interestRate: 2.1,
            isEmergencyFund: true,
          },
          update: {
            accountType: "입출금",
            interestRate: 2.1,
            isEmergencyFund: true,
          },
        },
      },
    },
  });

  await prisma.asset.upsert({
    where: { id: ASSET_IDS.cash2 },
    create: {
      id: ASSET_IDS.cash2,
      profileId: profile.id,
      type: "CASH",
      name: "정기예금",
      institutionOrLocation: "국민은행",
      currentValue: 20_000_000,
      cash: {
        create: {
          accountType: "정기예금",
          interestRate: 3.2,
          maturityDate: "2026-12-31",
          isEmergencyFund: false,
        },
      },
    },
    update: {
      currentValue: 20_000_000,
      cash: {
        upsert: {
          create: {
            accountType: "정기예금",
            interestRate: 3.2,
            maturityDate: "2026-12-31",
            isEmergencyFund: false,
          },
          update: {
            accountType: "정기예금",
            interestRate: 3.2,
            maturityDate: "2026-12-31",
            isEmergencyFund: false,
          },
        },
      },
    },
  });

  // 사업 1
  await prisma.asset.upsert({
    where: { id: ASSET_IDS.business },
    create: {
      id: ASSET_IDS.business,
      profileId: profile.id,
      type: "BUSINESS",
      name: "1인 사업 지분",
      institutionOrLocation: "프리랜스",
      currentValue: 35_000_000,
      monthlyIncome: 3_200_000,
      business: {
        create: {
          ownershipRate: 100,
          valuationBasis: "연수익 배수",
          liquidityGrade: "중",
        },
      },
    },
    update: {
      currentValue: 35_000_000,
      monthlyIncome: 3_200_000,
      business: {
        upsert: {
          create: {
            ownershipRate: 100,
            valuationBasis: "연수익 배수",
            liquidityGrade: "중",
          },
          update: {
            ownershipRate: 100,
            valuationBasis: "연수익 배수",
            liquidityGrade: "중",
          },
        },
      },
    },
  });

  await upsertSnapshots(ASSET_IDS.realEstate, 920_000_000, 320_000_000, 0.008);
  await upsertSnapshots(ASSET_IDS.stockKr1, 42_000_000, 0, 0.02);
  await upsertSnapshots(ASSET_IDS.stockKr2, 15_000_000, 0, 0.03);
  await upsertSnapshots(ASSET_IDS.stockUs, 18_000, 0, 0.025);
  await upsertSnapshots(ASSET_IDS.cash1, 9_000_000, 0, 0);
  await upsertSnapshots(ASSET_IDS.cash2, 20_000_000, 0, 0);
  await upsertSnapshots(ASSET_IDS.business, 35_000_000, 0, 0.01);

  const year = new Date().getFullYear();
  const fortune = await new DemoFortuneProvider().generate(
    {
      name: profile.name,
      calendarType: profile.calendarType,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      timezone: profile.timezone,
      riskLevel: profile.riskLevel,
      goal: profile.goal,
    },
    year,
  );

  await prisma.fortuneSnapshot.upsert({
    where: {
      profileId_year_provider: {
        profileId: profile.id,
        year,
        provider: fortune.provider,
      },
    },
    create: {
      id: `demo-fortune-${year}`,
      profileId: profile.id,
      year,
      provider: fortune.provider,
      pillarsJson: JSON.stringify([fortuneMetaPillar(fortune), ...fortune.pillars]),
      decadeCyclesJson: JSON.stringify(fortune.decadeCycles),
      monthlyScoresJson: JSON.stringify(fortune.monthly),
      disclaimer: fortune.disclaimer,
    },
    update: {
      pillarsJson: JSON.stringify([fortuneMetaPillar(fortune), ...fortune.pillars]),
      decadeCyclesJson: JSON.stringify(fortune.decadeCycles),
      monthlyScoresJson: JSON.stringify(fortune.monthly),
      disclaimer: fortune.disclaimer,
      generatedAt: new Date(),
    },
  });

  const assetRows = await prisma.asset.findMany({ include: { cash: true } });
  const summary = computeFinanceSummary(assetRows, profile.monthlyExpense);
  const recs = buildRecommendations(summary, profile, fortune, []).filter(
    (r) => !r.key.startsWith("open."),
  );
  const keys = recs.map((r) => r.key);

  for (const rec of recs) {
    await prisma.actionTask.upsert({
      where: {
        profileId_dedupeKey: {
          profileId: profile.id,
          dedupeKey: rec.key,
        },
      },
      create: {
        profileId: profile.id,
        title: rec.title,
        category: rec.category,
        reason: rec.reason,
        completionCriteria: rec.completionCriteria,
        dueDate: rec.dueDate,
        source: rec.source,
        dedupeKey: rec.key,
        status: "TODO",
      },
      update: {
        title: rec.title,
        category: rec.category,
        reason: rec.reason,
        completionCriteria: rec.completionCriteria,
        dueDate: rec.dueDate,
        source: rec.source,
      },
    });
  }

  await prisma.actionTask.deleteMany({
    where: {
      profileId: profile.id,
      dedupeKey: { notIn: keys },
      status: "TODO",
    },
  });

  const counts = {
    profiles: await prisma.userProfile.count(),
    assets: await prisma.asset.count(),
    snapshots: await prisma.valuationSnapshot.count(),
    fortunes: await prisma.fortuneSnapshot.count(),
    actions: await prisma.actionTask.count(),
  };

  console.log("Seed OK (idempotent)", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
