import { ProfileForm } from "@/components/settings/profile-form";
import {
  DemoResetPanel,
  FortuneRegenPanel,
  MaskDefaultPanel,
} from "@/components/settings/settings-panels";
import { DisclaimerNotice } from "@/components/ui/disclaimer";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDesc, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <PageHeader
        title="설정"
        description="프로필, 금액 숨김, 운세, 데모 데이터를 관리합니다."
      />

      <DisclaimerNotice />

      <Card>
        <CardTitle>프로필 수정</CardTitle>
        <CardDesc>이름, 출생 정보, 위험선호, 선호 활동, 투자 기간, 목표, 생활비</CardDesc>
        <div className="mt-4">
          <ProfileForm
            profile={{
              name: profile.name,
              calendarType: profile.calendarType,
              birthDate: profile.birthDate,
              birthTime: profile.birthTime,
              timezone: profile.timezone,
              riskLevel: profile.riskLevel,
              goal: profile.goal,
              monthlyExpense: Number(profile.monthlyExpense),
              preferredActivity: profile.preferredActivity,
              investmentHorizon: profile.investmentHorizon,
            }}
          />
        </div>
      </Card>

      <MaskDefaultPanel maskDefault={profile.maskDefault} />
      <FortuneRegenPanel year={year} />
      <DemoResetPanel />
    </div>
  );
}
