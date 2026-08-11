import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isAuthBypassed, isAuthConfigured } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // 로그인 설정이 전혀 없으면 데모 모드로 바로 앱 사용
  if (isAuthBypassed() && !isAuthConfigured()) {
    redirect("/dashboard");
  }

  if (isAuthConfigured()) {
    const { getSessionUser } = await import("@/lib/firebase/session");
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="text-xs font-medium tracking-[0.18em] text-primary">WEALTH COMPASS</p>
      <h1 className="mt-2 font-display text-[28px] font-semibold">재물 나침반</h1>
      <p className="mt-2 text-sm text-ink/65">이메일로 로그인하고 내 데이터를 안전하게 저장하세요.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
