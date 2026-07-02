"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { subscribePushAction, unsubscribePushAction } from "@/lib/push/actions";

type PushState = "loading" | "unsupported" | "denied" | "idle" | "subscribed";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function NotificationsRow() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_KEY) {
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
  }, []);

  if (state === "loading" || state === "unsupported") return null;

  async function handleToggle() {
    if (state === "subscribed") {
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
    } else {
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
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY) as BufferSource,
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
  }

  return (
    <li className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <Bell size={20} style={{ color: "var(--terra)" }} />
        <span className="text-brand text-base" style={{ color: "var(--fg)" }}>
          Notificaciones
        </span>
      </div>
      {state === "denied" ? (
        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--fg-30)" }}>
          <BellOff size={14} /> Bloqueadas
        </span>
      ) : (
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy}
          className="rounded-full px-3 py-1 text-xs font-medium transition active:opacity-80 disabled:opacity-50"
          style={{
            background: state === "subscribed" ? "var(--moss)" : "var(--terra)",
            color: "#fff",
          }}
        >
          {busy
            ? "..."
            : state === "subscribed"
              ? "Activas"
              : "Activar"}
        </button>
      )}
    </li>
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
