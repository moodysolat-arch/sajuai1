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

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production") {
      return fail("FORBIDDEN", "프로덕션에서는 데모 초기화를 사용할 수 없습니다.", 403);
    }
    await runSeed();
    await prisma.userProfile.updateMany({
      data: { onboardingCompleted: true, isDemo: true },
    });
    revalidatePath("/", "layout");
    return ok({ reset: true, demo: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
