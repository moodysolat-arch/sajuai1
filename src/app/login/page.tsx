import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isAuthBypassed } from "@/lib/auth";
import { isFirebaseAdminConfigured } from "@/lib/firebase/config";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (isAuthBypassed() && !isFirebaseAdminConfigured()) {
    // 로컬 개발에서 Firebase 없이 바로 앱 사용
    redirect("/dashboard");
  }

  const { getSessionUser } = await import("@/lib/firebase/session");
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

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
