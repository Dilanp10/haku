import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Globe, Instagram, MapPin } from "lucide-react";
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

export const revalidate = 600; // ISR 10 min

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
    <main id="main" className="container py-10">
      <Link
        href="/lugares"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Todos los lugares
      </Link>

      <header className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Catamarca
        </p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-3xl font-bold">{venue.name}</h1>
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
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> {venue.address}
          </p>
        )}
      </header>

      {venue.coverImageUrl && (
        <div className="relative mt-6 aspect-[16/7] overflow-hidden rounded-lg border">
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

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Info principal */}
        <div className="lg:col-span-2 space-y-6">
          {venue.description && (
            <section>
              <p className="text-muted-foreground leading-relaxed">{venue.description}</p>
            </section>
          )}

          {venueFoodTypes.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Qué encontrás
              </h2>
              <div className="flex flex-wrap gap-2">
                {venueFoodTypes.map((ft) => (
                  <span
                    key={ft.id}
                    className="rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                  >
                    {ft.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {venue.location && (
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Cómo llegar
              </h2>
              <div className="overflow-hidden rounded-lg border">
                <VenueMap
                  markers={markers}
                  center={venue.location}
                  className="h-[300px] w-full"
                />
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {hours.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <OpeningHours hours={hours} />
            </div>
          )}

          {venue.priceRange && (
            <InfoCard label="Precio">
              <span className="text-lg font-bold text-primary">{venue.priceRange}</span>
            </InfoCard>
          )}

          {(venue.phone || venue.website || venue.instagram) && (
            <InfoCard label="Contacto">
              <ul className="space-y-2 text-sm">
                {venue.phone && (
                  <li>
                    <a
                      href={`tel:${venue.phone}`}
                      className="inline-flex items-center gap-2 hover:text-primary"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
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
                      className="inline-flex items-center gap-2 hover:text-primary"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
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
                      className="inline-flex items-center gap-2 hover:text-primary"
                    >
                      <Instagram className="h-4 w-4 text-muted-foreground" />
                      @{venue.instagram.replace(/^@/, "")}
                    </a>
                  </li>
                )}
              </ul>
            </InfoCard>
          )}
        </aside>
      </div>
      <ViewCounter slug={slug} />
    </main>
  );
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
