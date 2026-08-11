import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

/** Firestore에 사용자 프로필·메타를 저장 (Firebase DB) */
export async function syncProfileToFirestore(input: {
  uid: string;
  email: string | null;
  profile: {
    id: string;
    name: string;
    calendarType: string;
    birthDate: string;
    birthTime: string | null;
    timezone: string;
    riskLevel: string;
    goal: string;
    monthlyExpense: number;
    preferredActivity: string;
    investmentHorizon: string;
    onboardingCompleted: boolean;
    isDemo: boolean;
    maskDefault: boolean;
    updatedAt: Date;
  };
}) {
  if (!isFirebaseAdminConfigured()) return;
  const db = getAdminFirestore();
  const ref = db.collection("users").doc(input.uid);
  await ref.set(
    {
      email: input.email,
      profileId: input.profile.id,
      profile: {
        ...input.profile,
        updatedAt: input.profile.updatedAt.toISOString(),
      },
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function syncAssetToFirestore(input: {
  uid: string;
  asset: Record<string, unknown>;
}) {
  if (!isFirebaseAdminConfigured()) return;
  const id = String(input.asset.id);
  await getAdminFirestore()
    .collection("users")
    .doc(input.uid)
    .collection("assets")
    .doc(id)
    .set({ ...input.asset, syncedAt: new Date().toISOString() }, { merge: true });
}

export async function deleteAssetFromFirestore(uid: string, assetId: string) {
  if (!isFirebaseAdminConfigured()) return;
  await getAdminFirestore()
    .collection("users")
    .doc(uid)
    .collection("assets")
    .doc(assetId)
    .delete()
    .catch(() => undefined);
}

export async function syncFortuneToFirestore(input: {
  uid: string;
  year: number;
  fortune: Record<string, unknown>;
}) {
  if (!isFirebaseAdminConfigured()) return;
  await getAdminFirestore()
    .collection("users")
    .doc(input.uid)
    .collection("fortunes")
    .doc(String(input.year))
    .set({ ...input.fortune, syncedAt: new Date().toISOString() }, { merge: true });
}
