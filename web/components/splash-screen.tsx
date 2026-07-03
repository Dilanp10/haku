"use client";

import { useEffect, useState } from "react";

const KEY = "haku_splash_shown";

/** Overlay de bienvenida, visible una sola vez por sesión de navegador. */
export function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

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
    const t1 = setTimeout(() => setFading(true), 700);
    const t2 = setTimeout(() => setMounted(false), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: "var(--bg-deep)" }}
    >
      <div className="text-center">
        <div
          className="text-brand leading-none"
          style={{ fontSize: "clamp(3.5rem,14vw,5.5rem)", color: "var(--terra)" }}
        >
          Haku.
        </div>
        <div className="text-section mt-3">vamos</div>
      </div>
    </div>
  );
}
