import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { isFirebaseAdminConfigured } from "@/lib/firebase/config";

export { isFirebaseAdminConfigured };

function privateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY ?? "";
  return raw.replace(/\\n/g, "\n");
}

let app: App | undefined;

async function getAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    throw new Error("FIREBASE_ADMIN_NOT_CONFIGURED");
  }
  if (!app) {
    const { cert, getApps, initializeApp } = await import("firebase-admin/app");
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey(),
        }),
      });
  }
  return app;
}

export async function getAdminAuth(): Promise<Auth> {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getAdminApp());
}

export async function getAdminFirestore(): Promise<Firestore> {
  const { getFirestore } = await import("firebase-admin/firestore");
  return getFirestore(await getAdminApp());
}
