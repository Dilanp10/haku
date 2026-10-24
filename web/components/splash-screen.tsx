"use client";

import { useEffect, useState } from "react";

const KEY = "haku_splash_shown";

/** Overlay de bienvenida, visible una sola vez por sesión de navegador. */
export function SplashScreen() {
  const [mounted, setMounted] = useState(true);

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
    const t = setTimeout(() => setMounted(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className="splash-veil pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
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
