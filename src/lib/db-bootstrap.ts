import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";

let bootstrapping: Promise<void> | null = null;

function isVercelRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function templateDbPath() {
  return path.join(process.cwd(), "prisma", "runtime-template.db");
}

function runtimeDbPath() {
  return path.join("/tmp", "sajuai.db");
}

function copyTemplateIfNeeded() {
  if (!isVercelRuntime()) return;
  const dest = runtimeDbPath();
  const src = templateDbPath();
  if (fs.existsSync(dest)) return;
  if (!fs.existsSync(src)) {
    console.error("[db-bootstrap] missing template DB:", src);
    return;
  }
  fs.copyFileSync(src, dest);
}

/**
 * Vercel에서는 빌드된 SQLite 템플릿을 /tmp로 복사하고,
 * 비어 있으면 최소 데모 프로필을 보장한다.
 */
export async function ensureDemoDatabase() {
  if (!bootstrapping) {
    bootstrapping = (async () => {
      copyTemplateIfNeeded();

      try {
        const count = await prisma.userProfile.count();
        if (count > 0) return;
      } catch (error) {
        console.error("[db-bootstrap] count failed", error);
      }

      try {
        await prisma.userProfile.create({
          data: {
            id: "demo-profile-001",
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
        });
      } catch (error) {
        console.error("[db-bootstrap] seed failed", error);
      }
    })().catch((error) => {
      bootstrapping = null;
      throw error;
    });
  }
  await bootstrapping;
}
