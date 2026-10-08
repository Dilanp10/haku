"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  return (
    <div
      className="fixed bottom-[calc(var(--bottom-nav-height,80px)+12px)] inset-x-4 z-50 mx-auto max-w-sm rounded-card p-3 shadow-lg md:bottom-6 animate-fade-in-up"
      style={{ background: "var(--card-bg)", border: "1px solid var(--line-2)" }}
    >
      <div className="flex items-center gap-3">
        <Download size={20} style={{ color: "var(--terra)" }} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-brand text-sm" style={{ color: "var(--fg)" }}>
            Instalá Haku
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-50)" }}>
            Accedé más rápido desde tu pantalla de inicio.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-button px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: "var(--terra)" }}
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="shrink-0"
          style={{ color: "var(--fg-30)" }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
