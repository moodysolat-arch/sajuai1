import { revalidatePath } from "next/cache";
import { ok, fail, handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { actionStatusSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const action = await prisma.actionTask.findUnique({ where: { id } });
    if (!action) return fail("NOT_FOUND", "액션을 찾을 수 없습니다.", 404);
    return ok({ action });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = actionStatusSchema.parse(await request.json());
    if (body.status === undefined && body.memo === undefined) {
      return fail("VALIDATION_ERROR", "status 또는 memo가 필요합니다.", 400);
    }
    const existing = await prisma.actionTask.findUnique({ where: { id } });
    if (!existing) return fail("NOT_FOUND", "액션을 찾을 수 없습니다.", 404);

    const action = await prisma.actionTask.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.memo !== undefined ? { memo: body.memo } : {}),
      },
    });
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/actions");
    return ok({ action });
  } catch (error) {
    return handleRouteError(error);
  }
}
