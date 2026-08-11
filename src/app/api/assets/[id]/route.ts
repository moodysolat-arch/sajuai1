import { revalidatePath } from "next/cache";
import { ok, fail, handleRouteError } from "@/lib/api";
import { getCurrentProfile, getSessionUser } from "@/lib/auth";
import {
  deleteAssetFromFirestore,
  syncAssetToFirestore,
} from "@/lib/firestore/user-store";
import { prisma } from "@/lib/prisma";
import { updateAssetSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const profile = await getCurrentProfile();
    const { id } = await params;
    const asset = await prisma.asset.findFirst({
      where: { id, profileId: profile.id },
      include: {
        realEstate: true,
        stock: true,
        cash: true,
        business: true,
        snapshots: { orderBy: { capturedAt: "desc" }, take: 12 },
      },
    });
    if (!asset) return fail("NOT_FOUND", "자산을 찾을 수 없습니다.", 404);
    return ok({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const profile = await getCurrentProfile();
    const { id } = await params;
    const body = updateAssetSchema.parse(await request.json());
    const existing = await prisma.asset.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!existing) return fail("NOT_FOUND", "자산을 찾을 수 없습니다.", 404);

    const asset = await prisma.$transaction(async (tx) => {
      const updated = await tx.asset.update({
        where: { id },
        data: {
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
        },
      });

      if (body.realEstate) {
        await tx.realEstateDetail.upsert({
          where: { assetId: id },
          create: { assetId: id, ...body.realEstate },
          update: body.realEstate,
        });
      }
      if (body.stock) {
        await tx.stockHolding.upsert({
          where: { assetId: id },
          create: { assetId: id, ...body.stock },
          update: body.stock,
        });
      }
      if (body.cash) {
        await tx.cashAccount.upsert({
          where: { assetId: id },
          create: { assetId: id, ...body.cash },
          update: body.cash,
        });
      }
      if (body.business) {
        await tx.businessDetail.upsert({
          where: { assetId: id },
          create: { assetId: id, ...body.business },
          update: body.business,
        });
      }

      if (body.currentValue !== undefined || body.debtValue !== undefined) {
        await tx.valuationSnapshot.create({
          data: {
            assetId: id,
            value: body.currentValue ?? Number(existing.currentValue),
            debt: body.debtValue ?? Number(existing.debtValue),
          },
        });
      }

      return tx.asset.findUnique({
        where: { id: updated.id },
        include: {
          realEstate: true,
          stock: true,
          cash: true,
          business: true,
        },
      });
    });

    const session = await getSessionUser();
    if (session && asset) {
      await syncAssetToFirestore({
        uid: session.uid,
        asset: {
          id: asset.id,
          profileId: asset.profileId,
          type: asset.type,
          name: asset.name,
          currentValue: asset.currentValue,
          debtValue: asset.debtValue,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/assets");
    revalidatePath("/assets/real-estate");
    revalidatePath("/assets/stocks");
    revalidatePath("/assets/cash");
    revalidatePath(`/assets/${id}`);
    return ok({ asset });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const profile = await getCurrentProfile();
    const { id } = await params;
    const existing = await prisma.asset.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!existing) return fail("NOT_FOUND", "자산을 찾을 수 없습니다.", 404);
    await prisma.asset.delete({ where: { id } });

    const session = await getSessionUser();
    if (session) await deleteAssetFromFirestore(session.uid, id);

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/assets");
    revalidatePath("/assets/real-estate");
    revalidatePath("/assets/stocks");
    revalidatePath("/assets/cash");
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
