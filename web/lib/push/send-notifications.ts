import webpush from "web-push";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getVapidKeys } from "./vapid";

export interface NotifiableEvent {
  title: string;
  slug: string;
}

export async function sendNewEventNotifications(events: NotifiableEvent[]): Promise<void> {
  if (events.length === 0) return;

  const vapid = getVapidKeys();
  if (!vapid.publicKey || !vapid.privateKey) return;

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const admin = createAdminSupabase();
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth");

  if (error || !subs || subs.length === 0) return;

  const event = events[0]!;
  const payload = JSON.stringify({
    title: "Nuevo evento en Haku",
    body: event.title,
    url: event.slug ? `/eventos/${event.slug}` : "/eventos",
  });

  const gone: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload,
        );
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          gone.push(sub.id as string);
        }
      }
    }),
  );

  if (gone.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", gone);
  }
}
