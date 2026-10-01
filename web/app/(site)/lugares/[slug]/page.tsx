import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Globe, Instagram, MapPin, Navigation } from "lucide-react";
import {
  getVenueBySlug,
  listCategories,
  listFoodTypes,
  createSupabaseCoreRepository,
} from "@haku/core";
import { categoryVisual } from "@/lib/category-visuals";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { VenueMapClient } from "@/components/venue-map-client";
import { ViewCounter } from "@/components/view-counter";
import { SaveButton } from "./save-button";
import { RatingDisplay } from "./rating-display";
import { RatingPicker } from "./rating-picker";
import { OpeningHours } from "./opening-hours";

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

  const [statsRes, hoursRes] = await Promise.all([
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
  ]);
  const stats = statsRes.data;
  const hours = hoursRes.data ?? [];
  const allFoodTypes = foodTypesRes.ok ? foodTypesRes.value : [];
  const venueFoodTypes = allFoodTypes.filter((ft) => venue.foodTypeIds.includes(ft.id));

  const markers = venue.location
    ? [{ lat: venue.location.lat, lng: venue.location.lng, title: venue.name }]
    : [];

  return (
    <main id="main" className="mx-auto max-w-2xl pb-bottom">
      {/* Héroe full-bleed en mobile, contenido con radios en ≥ md (spec 031 O4) */}
      <header className="relative md:mt-6">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden md:aspect-[16/6] md:rounded-[12px]"
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
              className="object-cover"
              style={{ viewTransitionName: `venue-image-${venue.id}` } as React.CSSProperties}
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

          {/* Gradiente + nombre superpuesto */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-16 pb-4 px-4">
            {category && (
              <p className="text-section" style={{ color: "rgba(255,255,255,0.75)" }}>
                {category.name}
              </p>
            )}
            <h1 className="text-brand text-3xl leading-tight text-white drop-shadow-sm">
              {venue.name}
            </h1>
          </div>

          {/* Volver + guardar superpuestos (área táctil ≥44px) */}
          <Link
            href="/lugares"
            aria-label="Todos los lugares"
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

        {/* Rating + dirección debajo del héroe */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3">
            <RatingDisplay
              averageRating={stats?.average_rating ?? null}
              ratingCount={stats?.rating_count ?? 0}
            />
            <RatingPicker venueId={venue.id} slug={slug} hasSession={!!profile} />
          </div>
          {venue.address && (
            <p
              className="mt-1 flex items-center gap-1 text-sm"
              style={{ color: "var(--fg-50)" }}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
              {venue.address}
            </p>
          )}
        </div>
      </header>

      <div className="mt-8 space-y-6 px-4">
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

        {/* Info cards row */}
        <div className="flex flex-wrap gap-3">
          {venue.priceRange && (
            <InfoCard label="Precio">
              <span className="text-brand text-lg" style={{ color: "var(--accent)" }}>
                {venue.priceRange}
              </span>
            </InfoCard>
          )}

          {hours.length > 0 && (
            <InfoCard label="Horarios" className="flex-1 min-w-[200px]">
              <OpeningHours hours={hours} />
            </InfoCard>
          )}
        </div>

        {(venue.phone || venue.website || venue.instagram) && (
          <InfoCard label="Contacto">
            <ul className="space-y-2 text-sm">
              {venue.phone && (
                <li>
                  <a
                    href={`tel:${venue.phone}`}
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{ color: "var(--fg)" }}
                  >
                    <Phone className="h-4 w-4" style={{ color: "var(--fg-50)" }} />
                    {venue.phone}
                  </a>
                </li>
              )}
              {venue.website && (
                <li>
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    <Globe className="h-4 w-4" style={{ color: "var(--fg-50)" }} />
                    Sitio web
                  </a>
                </li>
              )}
              {venue.instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${venue.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    <Instagram className="h-4 w-4" style={{ color: "var(--fg-50)" }} />
                    @{venue.instagram.replace(/^@/, "")}
                  </a>
                </li>
              )}
            </ul>
          </InfoCard>
        )}

        {venue.location && (
          <section>
            <h2 className="text-section mb-2">Cómo llegar</h2>
            <div className="overflow-hidden rounded-[12px] border" style={{ borderColor: "var(--line)" }}>
              <VenueMapClient
                markers={markers}
                center={venue.location}
                className="h-[250px] w-full"
              />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-[10px] border px-4 py-2 text-sm font-medium transition active:opacity-80"
              style={{ borderColor: "var(--line-2)", color: "var(--accent)" }}
            >
              <Navigation className="h-4 w-4" /> Abrir en Google Maps
            </a>
          </section>
        )}
      </div>
      <ViewCounter slug={slug} />
    </main>
  );
}

function InfoCard({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border p-4 ${className}`}
      style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
    >
      <p className="text-section mb-2">{label}</p>
      {children}
    </div>
  );
}
