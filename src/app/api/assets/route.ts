import { revalidatePath } from "next/cache";
import { ok, handleRouteError } from "@/lib/api";
import { getCurrentProfile, getSessionUser } from "@/lib/auth";
import { listAssetsForProfile } from "@/lib/assets-query";
import { syncAssetToFirestore } from "@/lib/firestore/user-store";
import { prisma } from "@/lib/prisma";
import { createAssetSchema } from "@/lib/validators";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    const assets = await listAssetsForProfile(profile.id);
    return ok({ assets });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    const body = createAssetSchema.parse(await request.json());
    const asset = await prisma.asset.create({
      data: {
        profileId: profile.id,
        type: body.type,
        name: body.name,
        institutionOrLocation: body.institutionOrLocation,
        currency: body.currency,
        fxRateToKrw: body.fxRateToKrw,
        currentValue: body.currentValue,
        debtValue: body.debtValue,
        monthlyIncome: body.monthlyIncome,
        monthlyExpense: body.monthlyExpense,
        memo: body.memo,
        realEstate: body.realEstate ? { create: body.realEstate } : undefined,
        stock: body.stock ? { create: body.stock } : undefined,
        cash: body.cash ? { create: body.cash } : undefined,
        business: body.business ? { create: body.business } : undefined,
        snapshots: {
          create: {
            value: body.currentValue,
            debt: body.debtValue,
          },
        },
      },
      include: {
        realEstate: true,
        stock: true,
        cash: true,
        business: true,
      },
    });

    const session = await getSessionUser();
    if (session) {
      await syncAssetToFirestore({
        uid: session.uid,
        asset: {
          id: asset.id,
          profileId: asset.profileId,
          type: asset.type,
          name: asset.name,
          currentValue: asset.currentValue,
          debtValue: asset.debtValue,
          currency: asset.currency,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/assets");
    revalidatePath("/assets/real-estate");
    revalidatePath("/assets/stocks");
    revalidatePath("/assets/cash");
    return ok({ asset }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
