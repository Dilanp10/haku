import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  searchVenuesNearby,
  listCategories,
  distanceKm,
  createSupabaseCoreRepository,
  type Category,
  type Venue,
} from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { VenueCard } from "@/components/venue-card";
import { VenueMap } from "@/components/venue-map";
import { LocateMe } from "@/components/locate-me";

// Per-request (depende de lat/lng del usuario; no se cachea).
export const dynamic = "force-dynamic";

// La página depende de la geolocalización del usuario; no indexable.
export const metadata: Metadata = {
  title: "Cerca tuyo",
  robots: { index: false, follow: false },
};

const RADIUS_KM = 5;
const LIMIT = 30;

interface SearchParams {
  lat?: string;
  lng?: string;
}

export default async function LugaresCercaPage({
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
          <LocateMe redirectTo="/lugares/cerca" />
        </div>
      </main>
    );
  }

  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [venuesRes, categoriesRes] = await Promise.all([
    searchVenuesNearby(repo, { point: { lat, lng }, radiusKm: RADIUS_KM, limit: LIMIT }),
    listCategories(repo),
  ]);

  if (!venuesRes.ok) {
    return (
      <main id="main" className="container py-10">
        <Back />
        <h1 className="mt-4 text-2xl font-bold">No pudimos buscar cerca tuyo</h1>
        <p className="mt-2 text-sm text-muted-foreground">{venuesRes.error.message}</p>
        <div className="mt-6">
          <LocateMe redirectTo="/lugares/cerca" />
        </div>
      </main>
    );
  }

  const venues = venuesRes.value;
  const catById = new Map<string, Category>(
    (categoriesRes.ok ? categoriesRes.value : []).map((c) => [c.id, c]),
  );

  // Pin del usuario + pin por venue.
  const markers = [
    { lat, lng, title: "Estás acá" },
    ...venues
      .filter((v): v is Venue & { location: NonNullable<Venue["location"]> } => v.location !== null)
      .map((v) => ({
        lat: v.location.lat,
        lng: v.location.lng,
        title: v.name,
        href: `/lugares/${v.slug}`,
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
        {venues.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            No encontramos lugares publicados en un radio de {RADIUS_KM} km.{" "}
            <Link href="/lugares" className="text-primary hover:underline">
              Ver todos los lugares
            </Link>
            .
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {venues.length} {venues.length === 1 ? "lugar" : "lugares"} en un radio de {RADIUS_KM} km, ordenados por distancia.
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((v) => (
                <div key={v.id}>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-primary">
                    {v.location ? formatDistance(distanceKm({ lat, lng }, v.location)) : "—"}
                  </p>
                  <VenueCard venue={v} category={catById.get(v.categoryId)} />
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
      <h1 className="mt-1 text-3xl font-bold">Cerca tuyo</h1>
      <p className="mt-2 text-muted-foreground">
        Lo más cercano a vos, ordenado por distancia.
      </p>
    </header>
  );
}

function Back() {
  return (
    <Link
      href="/lugares"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" /> Todos los lugares
    </Link>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
