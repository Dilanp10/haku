"use client";

import { useState, useTransition } from "react";
import { MapPinned, Loader2 } from "lucide-react";
import { geocodeVenueAction } from "./actions";

export function GeocodeBtn({
  id,
  slug,
  address,
}: {
  id: string;
  slug: string;
  address: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = () => {
    setMsg(null);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("slug", slug);
    fd.set("address", address);
    start(async () => {
      const res = await geocodeVenueAction(fd);
      if (res.ok) {
        setMsg({
          ok: true,
          text: `Ubicación encontrada: ${res.display}`,
        });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition hover:border-primary/40 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPinned className="h-4 w-4" />
        )}
        {pending ? "Buscando…" : "Geocodificar dirección"}
      </button>
      {msg && (
        <p
          className={`text-xs ${msg.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {msg.text}
          {msg.ok && " — recargá para verla en el mapa."}
        </p>
      )}
    </div>
  );
}
