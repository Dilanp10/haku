import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Globe, Instagram, MapPin, Navigation } from "lucide-react";
import {
  getVenueBySlug,
  listFoodTypes,
  createSupabaseCoreRepository,
} from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { VenueMap } from "@/components/venue-map";
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

  const [venueRes, foodTypesRes, profile] = await Promise.all([
    getVenueBySlug(repo, { slug }),
    listFoodTypes(repo),
    getCurrentProfile(),
  ]);

  if (!venueRes.ok || !venueRes.value) notFound();
  const venue = venueRes.value;

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
    <main id="main" className="mx-auto max-w-2xl px-4 py-8 pb-bottom">
      <Link
        href="/lugares"
        className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los lugares
      </Link>

      <header className="mt-4">
        <p className="text-section mb-1">Catamarca</p>
        <div className="flex items-center gap-2">
          <h1 className="text-brand text-3xl" style={{ color: "var(--fg)" }}>
            {venue.name}
          </h1>
          <SaveButton venueId={venue.id} slug={slug} />
        </div>
        <div className="mt-1 flex items-center gap-3">
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
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--terra)" }} />
            {venue.address}
          </p>
        )}
      </header>

      {venue.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-[12px] border" style={{ borderColor: "var(--line)" }}>
          <Image
            src={venue.coverImageUrl}
            alt={venue.name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 80vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="mt-8 space-y-6">
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
              <span className="text-brand text-lg" style={{ color: "var(--terra)" }}>
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
                    style={{ color: "var(--terra)" }}
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
                    style={{ color: "var(--terra)" }}
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
              <VenueMap
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
              style={{ borderColor: "var(--line-2)", color: "var(--terra)" }}
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
