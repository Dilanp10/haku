"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MapPin, Loader2, Check, X, Lock, RotateCw } from "lucide-react";

export function LocateMeInline() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [, startTransition] = useTransition();

  const hasLocation = sp.get("lat") && sp.get("lng");

  // Detecta si el permiso ya fue bloqueado por el usuario, sin pedirlo.
  useEffect(() => {
    if (!("permissions" in navigator)) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setPermissionDenied(status.state === "denied");
        status.onchange = () => setPermissionDenied(status.state === "denied");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function clearLocation() {
    const params = new URLSearchParams(sp);
    params.delete("lat");
    params.delete("lng");
    const qs = params.toString();
    startTransition(() =>
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }

  function requestLocation() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    if (permissionDenied) {
      setShowHelp(true);
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(sp);
        params.set("lat", pos.coords.latitude.toFixed(6));
        params.set("lng", pos.coords.longitude.toFixed(6));
        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          setBusy(false);
        });
      },
      (err) => {
        setBusy(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setShowHelp(true);
        } else {
          setError("No pudimos obtener tu ubicación.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (hasLocation) {
    return (
      <div
        className="mt-3 flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs"
        style={{
          borderColor: "var(--line)",
          background: "var(--card-bg)",
          color: "var(--moss)",
        }}
      >
        <Check className="h-3.5 w-3.5" />
        <span className="flex-1">Ubicación activa · ordenado por cercanía.</span>
        <button
          type="button"
          onClick={clearLocation}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--fg-50)" }}
          aria-label="Quitar ubicación"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={requestLocation}
        disabled={busy}
        className="flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-xs transition active:opacity-80 disabled:opacity-60"
        style={{
          borderColor: "var(--line)",
          background: "var(--card-bg)",
          color: "var(--fg-50)",
        }}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: "var(--terra)" }} />
        ) : permissionDenied ? (
          <Lock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--rust)" }} />
        ) : (
          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--terra)" }} />
        )}
        <span className="flex-1 text-left">
          {busy
            ? "Obteniendo ubicación…"
            : permissionDenied
              ? "Ubicación bloqueada · tocá para ver cómo activarla"
              : (error ?? "Activá la ubicación para ver distancias.")}
        </span>
      </button>

      {showHelp && (
        <div
          className="mt-2 rounded-[10px] border p-3 text-xs animate-slide-up"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)", color: "var(--fg-70)" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium" style={{ color: "var(--fg)" }}>
              Reactivar la ubicación
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label="Cerrar"
              style={{ color: "var(--fg-50)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>
              Tocá el ícono de <Lock className="inline h-3 w-3" /> candado (o &ldquo;ⓘ&rdquo;) junto a la
              dirección del sitio, arriba del navegador.
            </li>
            <li>Buscá el permiso &ldquo;Ubicación&rdquo; y cambialo a &ldquo;Permitir&rdquo;.</li>
            <li>Volvé a esta página y tocá el botón de nuevo.</li>
          </ol>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:opacity-80"
            style={{ background: "var(--terra)", color: "#fff" }}
          >
            <RotateCw className="h-3 w-3" /> Ya lo activé, recargar
          </button>
        </div>
      )}
    </div>
  );
}
