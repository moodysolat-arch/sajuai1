import { revalidatePath } from "next/cache";
import { ok, handleRouteError } from "@/lib/api";
import { getCurrentProfile, getSessionUser } from "@/lib/auth";
import { syncProfileToFirestore } from "@/lib/firestore/user-store";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validators";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    return ok({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const raw = await request.json();
    const current = await getCurrentProfile();

    if (
      raw &&
      typeof raw === "object" &&
      Object.keys(raw).length === 1 &&
      "maskDefault" in raw
    ) {
      const profile = await prisma.userProfile.update({
        where: { id: current.id },
        data: { maskDefault: Boolean(raw.maskDefault) },
      });
      const session = await getSessionUser();
      if (session) {
        await syncProfileToFirestore({
          uid: session.uid,
          email: session.email ?? profile.email,
          profile,
        });
      }
      revalidatePath("/settings");
      revalidatePath("/", "layout");
      return ok({ profile });
    }

    const body = profileSchema.parse(raw);
    const profile = await prisma.userProfile.update({
      where: { id: current.id },
      data: {
        name: body.name,
        calendarType: body.calendarType,
        birthDate: body.birthDate,
        birthTime: body.birthTime ?? null,
        timezone: body.timezone,
        riskLevel: body.riskLevel,
        goal: body.goal,
        monthlyExpense: body.monthlyExpense,
        preferredActivity: body.preferredActivity,
        investmentHorizon: body.investmentHorizon,
        ...(body.maskDefault !== undefined ? { maskDefault: body.maskDefault } : {}),
      },
    });

    const session = await getSessionUser();
    if (session) {
      await syncProfileToFirestore({
        uid: session.uid,
        email: session.email ?? profile.email,
        profile,
      });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidatePath("/wealth-type");
    return ok({ profile });
  } catch (error) {
    return handleRouteError(error);
  }
}
