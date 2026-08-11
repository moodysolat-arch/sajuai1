import { spawn } from "node:child_process";
import { revalidatePath } from "next/cache";
import { ok, fail, handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function runSeed() {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["tsx", "prisma/seed.ts"], {
      cwd: process.cwd(),
      shell: true,
      stdio: "inherit",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Seed failed with code ${code}`));
    });
    child.on("error", reject);
  });
}

/** 데모로 둘러보기 — 시드 로드 후 온보딩 완료·데모 플래그 */
export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return fail("FORBIDDEN", "프로덕션에서는 데모 둘러보기를 사용할 수 없습니다.", 403);
    }
    await runSeed();
    const profile = await prisma.userProfile.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!profile) {
      return fail("PROFILE_MISSING", "데모 프로필을 만들지 못했습니다.", 500);
    }
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        onboardingCompleted: true,
        isDemo: true,
      },
    });
    revalidatePath("/", "layout");
    return ok({ demo: true, profileId: profile.id });
  } catch (error) {
    return handleRouteError(error);
  }
}
