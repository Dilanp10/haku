import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  searchEventsNearby,
  createSupabaseEventRepository,
  type Event,
} from "@haku/events";
import { distanceKm } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { EventCard } from "@/components/event-card";
import { VenueMap } from "@/components/venue-map";
import { LocateMe } from "@/components/locate-me";

// Per-request: depende de la ubicación del usuario, no se cachea.
export const dynamic = "force-dynamic";

// Contiene datos de ubicación personal; no indexable.
export const metadata: Metadata = {
  title: "Eventos cerca tuyo",
  robots: { index: false, follow: false },
};

const RADIUS_KM = 10;
const LIMIT = 20;

interface SearchParams {
  lat?: string;
  lng?: string;
}

export default async function EventosCercaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const lat = sp.lat !== undefined ? Number(sp.lat) : NaN;
  const lng = sp.lng !== undefined ? Number(sp.lng) : NaN;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <main id="main" className="container py-10">
        <Back />
        <Header />
        <div className="mt-8 mx-auto max-w-md">
          <LocateMe redirectTo="/eventos/cerca" />
        </div>
      </main>
    );
  }

  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);

  const res = await searchEventsNearby(repo, {
    point: { lat, lng },
    radiusKm: RADIUS_KM,
    limit: LIMIT,
  });

  if (!res.ok) {
    return (
      <main id="main" className="container py-10">
        <Back />
        <h1 className="mt-4 text-2xl font-bold">No pudimos buscar eventos cerca tuyo</h1>
        <p className="mt-2 text-sm text-muted-foreground">{res.error.message}</p>
        <div className="mt-6">
          <LocateMe redirectTo="/eventos/cerca" />
        </div>
      </main>
    );
  }

  const events = res.value;

  const markers = [
    { lat, lng, title: "Estás acá" },
    ...events
      .filter((e): e is Event & { location: NonNullable<Event["location"]> } => !!e.location)
      .map((e) => ({
        lat: e.location.lat,
        lng: e.location.lng,
        title: e.title,
        href: `/eventos/${e.slug}`,
      })),
  ];

  return (
    <main id="main" className="container py-10">
      <Back />
      <Header />

      <section className="mt-6 rounded-lg border bg-card p-2">
        <VenueMap markers={markers} center={{ lat, lng }} className="h-[360px] w-full rounded-md" />
      </section>

      <section className="mt-8">
        {events.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            No encontramos eventos publicados en un radio de {RADIUS_KM} km.{" "}
            <Link href="/eventos" className="text-primary hover:underline">
              Ver todos los eventos
            </Link>
            .
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {events.length} {events.length === 1 ? "evento" : "eventos"} en un radio de{" "}
              {RADIUS_KM} km, ordenados por distancia.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <div key={e.id}>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-primary">
                    {e.location
                      ? formatDistance(distanceKm({ lat, lng }, e.location))
                      : "—"}
                  </p>
                  <EventCard event={e} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Header() {
  return (
    <header className="mt-4">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">Catamarca</p>
      <h1 className="mt-1 text-3xl font-bold">Eventos cerca tuyo</h1>
      <p className="mt-2 text-muted-foreground">
        Qué está pasando cerca de vos, ordenado por distancia.
      </p>
    </header>
  );
}

function Back() {
  return (
    <Link
      href="/eventos"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Todos los eventos
    </Link>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
