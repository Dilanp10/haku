"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, AlertCircle } from "lucide-react";

interface Props {
  /** Path al que vamos con ?lat=...&lng=... cuando se obtienen las coords. */
  redirectTo: string;
}

/**
 * Pide la ubicación del usuario y reescribe la URL con `?lat&lng`.
 * La página destino (RSC) hace la consulta real con `searchVenuesNearby`.
 */
export function LocateMe({ redirectTo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function locate() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const url = `${redirectTo}?lat=${lat}&lng=${lng}`;
        startTransition(() => router.push(url));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Denegaste el permiso de ubicación. Podés verlo desde Catamarca.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("No pudimos obtener tu ubicación. Probá de nuevo.");
        } else {
          setError("Tardó demasiado en responder. Probá de nuevo.");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <h2 className="text-lg font-semibold">¿Dónde estás?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Te mostramos los lugares más cercanos en un radio de 5 km.
      </p>
      <button
        type="button"
        onClick={locate}
        disabled={pending}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        <LocateFixed className="h-4 w-4" />
        {pending ? "Buscando…" : "Usar mi ubicación"}
      </button>
      {error ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      ) : null}
      <p className="mt-4 text-xs text-muted-foreground">
        <a
          className="underline hover:text-foreground"
          href={`${redirectTo}?lat=-28.4696&lng=-65.7795`}
        >
          Ver desde el centro de Catamarca
        </a>
      </p>
    </div>
  );
}
