import { serverEnv } from "@/lib/env";

export function getVapidKeys() {
  return {
    publicKey: serverEnv.vapidPrivateKey ? (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "") : "",
    privateKey: serverEnv.vapidPrivateKey,
    subject: serverEnv.vapidSubject,
  };
}
