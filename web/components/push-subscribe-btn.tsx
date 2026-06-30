"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "@/lib/push/actions";

type PushState = "loading" | "unsupported" | "denied" | "idle" | "subscribed";

export function PushSubscribeBtn({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidPublicKey) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "subscribed" : "idle"))
      .catch(() => setState("idle"));
  }, [vapidPublicKey]);

  if (state === "loading" || state === "unsupported") return null;

  if (state === "denied") {
    return (
      <button disabled className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground opacity-60" title="Permiso denegado. Activa las notificaciones desde la configuracion del navegador.">
        <BellOff className="h-4 w-4" /> Notificaciones bloqueadas
      </button>
    );
  }

  async function handleSubscribe() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });
      const json = sub.toJSON();
      const fd = new FormData();
      fd.set("endpoint", sub.endpoint);
      fd.set("p256dh", json.keys?.p256dh ?? "");
      fd.set("auth", json.keys?.auth ?? "");
      await subscribePushAction(fd);
      setState("subscribed");
    } catch {
      setState("idle");
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const fd = new FormData();
        fd.set("endpoint", sub.endpoint);
        await unsubscribePushAction(fd);
        await sub.unsubscribe();
      }
      setState("idle");
    } catch {
      setState("idle");
    } finally {
      setBusy(false);
    }
  }

  if (state === "subscribed") {
    return (
      <button
        onClick={handleUnsubscribe}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm text-green-800 transition hover:bg-green-100 disabled:opacity-50 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
      >
        <Bell className="h-4 w-4" /> {busy ? "..." : "Notificaciones activas"}
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-50"
    >
      <Bell className="h-4 w-4" /> {busy ? "Activando..." : "Activar notificaciones"}
    </button>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
