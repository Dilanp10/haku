import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Globe, Instagram, MapPin, Navigation, ChevronRight } from "lucide-react";
import {
  getVenueBySlug,
  listCategories,
  listFoodTypes,
  searchVenuesNearby,
  createSupabaseCoreRepository,
} from "@haku/core";
import { categoryVisual } from "@/lib/category-visuals";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getVenueStatuses } from "@/lib/venue-open-now";
import { VenueMapClient } from "@/components/venue-map-client";
import { ViewCounter } from "@/components/view-counter";
import { SaveButton } from "./save-button";
import { RatingDisplay } from "./rating-display";
import { RatingPicker } from "./rating-picker";
import { OpeningHours } from "./opening-hours";
import { HoursProgressBar } from "./hours-progress-bar";

export const revalidate = 600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const res = await getVenueBySlug(repo, { slug });
  if (!res.ok || !res.value) return { title: "Lugar no encontrado" };
  const v = res.value;
  return {
    title: v.name,
    description: v.description ?? `${v.name} — Catamarca`,
    alternates: { canonical: `/lugares/${slug}` },
    openGraph: {
      title: `${v.name} · Haku`,
      description: v.description ?? `${v.name} en Catamarca`,
      url: `/lugares/${slug}`,
    },
  };
}

function catamarcaNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Catamarca" }),
  );
}

export default async function VenueDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);

  const [venueRes, categoriesRes, foodTypesRes, profile] = await Promise.all([
    getVenueBySlug(repo, { slug }),
    listCategories(repo),
    listFoodTypes(repo),
    getCurrentProfile(),
  ]);

  if (!venueRes.ok || !venueRes.value) notFound();
  const venue = venueRes.value;
  const category = categoriesRes.ok
    ? categoriesRes.value.find((c) => c.id === venue.categoryId)
    : undefined;
  const visual = categoryVisual(category?.slug);

  const [statsRes, hoursRes, statusMap] = await Promise.all([
    supabase
      .from("venue_rating_stats")
      .select("average_rating, rating_count")
      .eq("venue_id", venue.id)
      .maybeSingle(),
    supabase
      .from("venue_hours")
      .select("day_of_week, opens_at, closes_at, closed")
      .eq("venue_id", venue.id)
      .order("day_of_week"),
    getVenueStatuses(supabase),
  ]);
  const stats = statsRes.data;
  const hours = hoursRes.data ?? [];
  const allFoodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const venueFoodTypes = allFoodTypes.filter((ft) => venue.foodTypeIds.includes(ft.id));

  const isOpen = statusMap.open.has(venue.id);
  const openInfo = statusMap.open.get(venue.id);

  const now = catamarcaNow();
  const todayRow = hours.find(
    (h) => h.day_of_week === now.getDay() && !h.closed,
  );

  // Nearby open venues
  let nearbyOpen: { slug: string; name: string; categoryName: string | null; imageUrl: string | null }[] = [];
  if (venue.location) {
    const nearbyRes = await searchVenuesNearby(repo, {
      point: venue.location,
      radiusKm: 2,
      limit: 10,
    });
    if (nearbyRes.ok) {
      const cats = categoriesRes.ok ? categoriesRes.value : [];
      const catById = new Map(cats.map((c) => [c.id, c]));
      nearbyOpen = nearbyRes.value
        .filter((v) => v.id !== venue.id && statusMap.open.has(v.id))
        .slice(0, 4)
        .map((v) => ({
          slug: v.slug,
          name: v.name,
          categoryName: catById.get(v.categoryId)?.name ?? null,
          imageUrl: v.coverImageUrl ?? null,
        }));
    }
  }

  const markers = venue.location
    ? [{ lat: venue.location.lat, lng: venue.location.lng, title: venue.name }]
    : [];

  const mapsUrl = venue.location
    ? `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`
    : null;

  return (
    <main id="main" className="mx-auto max-w-2xl pb-bottom">
      {/* Hero with slow zoom */}
      <header className="relative">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden md:aspect-[16/7]"
          style={
            venue.coverImageUrl ? { background: "var(--card-2)" } : { background: visual.bg }
          }
        >
          {venue.coverImageUrl ? (
            <Image
              src={venue.coverImageUrl}
              alt={venue.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover haku-cover-zoom"
              style={{
                animation: "haku-cover-zoom 20s ease-out forwards",
                viewTransitionName: `venue-image-${venue.id}`,
              } as React.CSSProperties}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-7xl"
              aria-hidden
              style={{ viewTransitionName: `venue-image-${venue.id}` } as React.CSSProperties}
            >
              {visual.emoji}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-20 pb-5 px-4">
            {category && (
              <p className="text-section" style={{ color: "rgba(255,255,255,0.75)" }}>
                {category.name}
              </p>
            )}
            <h1 className="text-brand text-3xl leading-tight text-white drop-shadow-sm">
              {venue.name}
            </h1>
          </div>

          {/* Back + save overlay buttons */}
          <Link
            href="/"
            aria-label="Volver"
            className="absolute left-3 top-3 z-10 flex size-11 items-center justify-center rounded-full backdrop-blur transition-opacity active:opacity-70"
            style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div
            className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full backdrop-blur"
            style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
          >
            <SaveButton venueId={venue.id} slug={slug} variant="overlay" />
          </div>
        </div>
      </header>

      {/* Status + rating strip */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <StatusBadge isOpen={isOpen} closesAt={openInfo?.closesAt ?? null} />
          <RatingDisplay
            averageRating={stats?.average_rating ?? null}
            ratingCount={stats?.rating_count ?? 0}
          />
        </div>

        {/* Progress bar for today's hours */}
        {todayRow && !todayRow.closed && (
          <div className="mt-3">
            <HoursProgressBar opensAt={todayRow.opens_at} closesAt={todayRow.closes_at} />
          </div>
        )}

        {venue.address && (
          <p
            className="mt-2 flex items-center gap-1.5 text-sm"
            style={{ color: "var(--fg-50)" }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
            {venue.address}
          </p>
        )}

        {/* Rating picker */}
        <div className="mt-2">
          <RatingPicker venueId={venue.id} slug={slug} hasSession={!!profile} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex gap-3 px-4">
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition active:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Navigation className="h-4 w-4" />
            Cómo llegar
          </a>
        )}
        {venue.phone && (
          <a
            href={`tel:${venue.phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition active:opacity-80"
            style={{ borderColor: "var(--line-2)", color: "var(--fg)" }}
          >
            <Phone className="h-4 w-4" />
            Llamar
          </a>
        )}
      </div>

      <div className="mt-6 space-y-6 px-4">
        {venue.description && (
          <section>
            <p className="text-[15px] leading-relaxed" style={{ color: "var(--fg-70)" }}>
              {venue.description}
            </p>
          </section>
        )}

        {venueFoodTypes.length > 0 && (
          <section>
            <h2 className="text-section mb-2">Qué encontrás</h2>
            <div className="flex flex-wrap gap-2">
              {venueFoodTypes.map((ft) => (
                <span
                  key={ft.id}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: "var(--line-2)", color: "var(--fg-70)", background: "var(--card-bg)" }}
                >
                  {ft.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {hours.length > 0 && (
          <section>
            <h2 className="text-section mb-2">Horarios</h2>
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
            >
              <OpeningHours hours={hours} />
            </div>
          </section>
        )}

        {(venue.website || venue.instagram) && (
          <section>
            <h2 className="text-section mb-2">Redes</h2>
            <div className="flex flex-col gap-2">
              {venue.website && (
                <a
                  href={venue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--accent)" }}
                >
                  <Globe className="h-4 w-4" style={{ color: "var(--fg-50)" }} />
                  Sitio web
                </a>
              )}
              {venue.instagram && (
                <a
                  href={`https://instagram.com/${venue.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--accent)" }}
                >
                  <Instagram className="h-4 w-4" style={{ color: "var(--fg-50)" }} />
                  @{venue.instagram.replace(/^@/, "")}
                </a>
              )}
            </div>
          </section>
        )}

        {/* Mini map */}
        {venue.location && (
          <section>
            <h2 className="text-section mb-2">Ubicación</h2>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--line)" }}>
              <VenueMapClient
                markers={markers}
                center={venue.location}
                className="h-[200px] w-full"
              />
            </div>
          </section>
        )}

        {/* Nearby open venues */}
        {nearbyOpen.length > 0 && (
          <section>
            <h2 className="text-section mb-3">Cerca, también abierto</h2>
            <div className="flex flex-col gap-1">
              {nearbyOpen.map((v) => (
                <Link
                  key={v.slug}
                  href={`/lugares/${v.slug}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--card-2)]"
                >
                  {v.imageUrl ? (
                    <Image
                      src={v.imageUrl}
                      alt={v.name}
                      width={44}
                      height={44}
                      className="shrink-0 rounded-lg object-cover"
                      style={{ width: 44, height: 44 }}
                    />
                  ) : (
                    <NearbyMonogram name={v.name} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{v.name}</p>
                    {v.categoryName && (
                      <p className="text-xs" style={{ color: "var(--fg-50)" }}>
                        {v.categoryName}
                      </p>
                    )}
                  </div>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--success)" }}
                    aria-label="Abierto"
                  />
                  <ChevronRight size={16} style={{ color: "var(--fg-30)" }} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <ViewCounter slug={slug} />
    </main>
  );
}

function StatusBadge({ isOpen, closesAt }: { isOpen: boolean; closesAt: string | null }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
      style={
        isOpen
          ? { background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success-fg)" }
          : { background: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)" }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: isOpen ? "var(--success)" : "var(--danger)" }}
      />
      {isOpen
        ? closesAt
          ? `Abierto · Cierra ${closesAt.slice(0, 5)}`
          : "Abierto"
        : "Cerrado"}
    </span>
  );
}

function NearbyMonogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
      style={{ background: "var(--card-2)", color: "var(--fg-50)" }}
    >
      {initials}
    </div>
  );
}
