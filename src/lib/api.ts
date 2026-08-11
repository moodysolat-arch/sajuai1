import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
) {
  const body: ApiErrorBody = { code, message };
  if (fieldErrors) body.fieldErrors = fieldErrors;
  return NextResponse.json(body, { status });
}

export function fromZod(error: ZodError) {
  return fail("VALIDATION_ERROR", "입력값을 확인해 주세요.", 400, error.flatten().fieldErrors);
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) return fromZod(error);
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return fail("UNAUTHORIZED", "로그인이 필요합니다.", 401);
  }
  if (error instanceof Error && error.message === "DEFAULT_PROFILE_MISSING") {
    return fail("PROFILE_MISSING", "프로필이 없습니다.", 404);
  }
  console.error(error);
  return fail("INTERNAL_ERROR", "서버 오류가 발생했습니다.", 500);
}
