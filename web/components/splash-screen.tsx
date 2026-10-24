"use client";

import { useEffect, useState } from "react";

const KEY = "haku_splash_shown";
/** Tiempo con la marca a plena vista, contado desde que hidrata. */
const HOLD_MS = 2800;
const FADE_MS = 1000;

/** Overlay de bienvenida, visible una sola vez por sesión de navegador. */
export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let alreadyShown = true;
    try {
      alreadyShown = sessionStorage.getItem(KEY) !== null;
      if (!alreadyShown) sessionStorage.setItem(KEY, "1");
    } catch {
      // sessionStorage no disponible (ej. modo privado estricto): no mostrar el splash.
    }
    if (alreadyShown) {
      setMounted(false);
      return;
    }
    const t1 = setTimeout(() => setLeaving(true), HOLD_MS);
    const t2 = setTimeout(() => setMounted(false), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={`splash-veil pointer-events-none fixed inset-0 z-[100] flex items-center justify-center${
        leaving ? " splash-leaving" : ""
      }`}
      style={{ background: "var(--bg-deep)" }}
    >
      <span
        className="splash-mark text-brand leading-none"
        style={{ fontSize: "clamp(9rem,40vw,17rem)", color: "var(--terra)" }}
      >
        H
      </span>
    </div>
  );
}
